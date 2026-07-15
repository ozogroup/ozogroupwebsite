-- ============================================================================
-- KIA Skin Care - Financial Repair - Rollback
-- Date: 2026-07-15
--
-- Only run this if 03_FORWARD_FINANCIAL_ENGINE_REPAIR.sql itself must be
-- undone. This does NOT touch anything from 04 (reconciliation/backfill) —
-- see the "Reconciliation data" section at the bottom for why, and how to
-- restore it manually and deliberately if truly needed.
--
-- What this file intentionally does NOT do, and why:
--   - Does NOT disable Row-Level Security on any table. RLS being off on
--     financial tables was the single most severe finding in this audit
--     (see docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md, B1). Rolling back to a
--     state with RLS off is not a safe "previous state" to return to.
--   - Does NOT drop the system_settings/bookings columns added in step 3.
--     Extra columns with safe defaults are harmless to leave in place, and
--     dropping columns is a destructive, hard-to-reverse operation this
--     package avoids by policy.
--   - Does NOT touch data (partner status, wallet balances, commission rows)
--     changed by 04 — see below.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Drop the new commission-status RPC. Safe: nothing else in the schema
--    depends on it, and lib/actions/commissions.ts has a JS fallback path.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.kia_set_commission_status(uuid, text);

-- ----------------------------------------------------------------------------
-- 2. Restore kia_generate_booking_commissions to its pre-repair definition
--    (commission base = payment_amount/final_amount/treatment_price, without
--    preferring bookings.net_amount). Identical to
--    MIGRATION_BUSINESS_ENGINE_COMMISSION_LEDGER_2026_07_14.sql.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_generate_booking_commissions(booking_uuid uuid)
RETURNS TABLE(
  id uuid, source_id uuid, partner_id uuid, level integer, percentage numeric,
  amount numeric, status public.commission_status, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row public.bookings%ROWTYPE;
  source_partner_id uuid;
  source_amount numeric;
  level_1_rate numeric := 6;
  level_2_rate numeric := 3;
  level_3_rate numeric := 1.7;
  level_4_rate numeric := 1.2;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND NOT public.kia_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO booking_row FROM public.bookings WHERE id = booking_uuid AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF booking_row.payment_status::text <> 'paid'
     OR booking_row.booking_status::text NOT IN ('confirmed', 'completed') THEN
    RETURN;
  END IF;

  source_amount := COALESCE(booking_row.payment_amount, booking_row.final_amount, booking_row.treatment_price, 0);
  IF source_amount <= 0 THEN RETURN; END IF;

  source_partner_id := booking_row.referred_by;
  IF source_partner_id IS NULL AND COALESCE(booking_row.referral_code, booking_row.partner_code) IS NOT NULL THEN
    SELECT p.id INTO source_partner_id FROM public.partners p
    WHERE upper(p.partner_code) = upper(COALESCE(booking_row.referral_code, booking_row.partner_code))
      AND p.status = 'active'::public.partner_status AND COALESCE(p.is_active, true) = true AND p.deleted_at IS NULL
    LIMIT 1;
  END IF;
  IF source_partner_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(cs.level_1_percentage, 6), COALESCE(cs.level_2_percentage, 3),
         COALESCE(cs.level_3_percentage, 1.7), COALESCE(cs.level_4_percentage, 1.2)
  INTO level_1_rate, level_2_rate, level_3_rate, level_4_rate
  FROM public.commission_settings cs WHERE cs.active = true ORDER BY cs.updated_at DESC NULLS LAST LIMIT 1;
  level_1_rate := COALESCE(level_1_rate, 6);
  level_2_rate := COALESCE(level_2_rate, 3);
  level_3_rate := COALESCE(level_3_rate, 1.7);
  level_4_rate := COALESCE(level_4_rate, 1.2);

  RETURN QUERY
  WITH RECURSIVE sponsor_chain(partner_id, earning_level, path) AS (
    SELECT p.sponsor_id, 1, ARRAY[p.id]
    FROM public.partners p WHERE p.id = source_partner_id AND p.sponsor_id IS NOT NULL AND p.sponsor_id <> p.id
    UNION ALL
    SELECT parent.sponsor_id, sponsor_chain.earning_level + 1, sponsor_chain.path || sponsor_chain.partner_id
    FROM sponsor_chain JOIN public.partners parent ON parent.id = sponsor_chain.partner_id
    WHERE sponsor_chain.earning_level < 4 AND parent.sponsor_id IS NOT NULL
      AND parent.sponsor_id <> ALL(sponsor_chain.path) AND parent.sponsor_id <> source_partner_id
  ),
  eligible_chain AS (
    SELECT DISTINCT ON (sponsor_chain.partner_id, sponsor_chain.earning_level)
      sponsor_chain.partner_id, sponsor_chain.earning_level,
      CASE sponsor_chain.earning_level WHEN 1 THEN level_1_rate WHEN 2 THEN level_2_rate
        WHEN 3 THEN level_3_rate WHEN 4 THEN level_4_rate ELSE 0 END AS earning_percentage
    FROM sponsor_chain JOIN public.partners p ON p.id = sponsor_chain.partner_id
    WHERE sponsor_chain.partner_id IS NOT NULL AND sponsor_chain.earning_level BETWEEN 1 AND 4
      AND p.status = 'active'::public.partner_status AND COALESCE(p.is_active, true) = true AND p.deleted_at IS NULL
      AND (p.membership_expires_at IS NULL OR p.membership_expires_at >= now())
    ORDER BY sponsor_chain.partner_id, sponsor_chain.earning_level
  )
  INSERT INTO public.commissions (
    partner_id, source_type, source_id, source_amount, level, percentage, amount,
    status, reversed, is_active, created_at, updated_at
  )
  SELECT eligible_chain.partner_id, 'booking'::public.source_type, booking_row.id, source_amount,
    eligible_chain.earning_level, eligible_chain.earning_percentage,
    ROUND(source_amount * eligible_chain.earning_percentage / 100, 2),
    'pending'::public.commission_status, false, true, now(), now()
  FROM eligible_chain
  WHERE eligible_chain.earning_percentage > 0
  ON CONFLICT (source_type, source_id, partner_id, level) WHERE deleted_at IS NULL DO NOTHING
  RETURNING commissions.id, commissions.source_id, commissions.partner_id, commissions.level,
    commissions.percentage, commissions.amount, commissions.status, commissions.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_generate_booking_commissions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_generate_booking_commissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_generate_booking_commissions(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Restore kia_approve_paid_membership to its pre-repair definition
--    (removes the flat membership-commission insert; identical to
--    PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_approve_paid_membership(membership_uuid uuid)
RETURNS TABLE(
  partner_id uuid, partner_code text, referral_link text, full_name text,
  email text, phone text, city text, approved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  membership_row public.memberships%ROWTYPE;
  profile_row public.profiles%ROWTYPE;
  partner_row public.partners%ROWTYPE;
  approved_time timestamptz := now();
  expires_time timestamptz := now() + interval '1 year';
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     AND NOT public.kia_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO membership_row FROM public.memberships WHERE id = membership_uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membership not found'; END IF;
  IF membership_row.payment_status <> 'paid'::public.payment_status THEN
    RAISE EXCEPTION 'Payment must be marked paid before approval';
  END IF;
  IF membership_row.membership_status = 'rejected'::public.membership_status THEN
    RAISE EXCEPTION 'Rejected membership cannot be approved';
  END IF;

  SELECT * INTO profile_row FROM public.profiles WHERE id = membership_row.partner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Linked profile/auth user not found for membership %', membership_uuid; END IF;

  SELECT * INTO partner_row FROM public.partners WHERE id = profile_row.id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.partners (
      id, partner_code, city, address, pin_code, sponsor_id, status,
      wallet_balance, total_earnings, paid_earnings,
      membership_purchased_at, membership_started_at, membership_expires_at,
      is_active, created_at, updated_at
    )
    VALUES (
      profile_row.id, null, membership_row.city, membership_row.address, membership_row.pin_code,
      membership_row.sponsor_id, 'active'::public.partner_status, 0, 0, 0,
      approved_time, approved_time, expires_time, true, approved_time, approved_time
    )
    RETURNING * INTO partner_row;
  ELSE
    UPDATE public.partners
    SET status = 'active'::public.partner_status, is_active = true,
      sponsor_id = COALESCE(public.partners.sponsor_id, membership_row.sponsor_id),
      city = COALESCE(NULLIF(public.partners.city, ''), membership_row.city),
      address = COALESCE(NULLIF(public.partners.address, ''), membership_row.address),
      pin_code = COALESCE(NULLIF(public.partners.pin_code, ''), membership_row.pin_code),
      membership_purchased_at = COALESCE(public.partners.membership_purchased_at, approved_time),
      membership_started_at = COALESCE(public.partners.membership_started_at, approved_time),
      membership_expires_at = COALESCE(public.partners.membership_expires_at, expires_time),
      updated_at = approved_time
    WHERE public.partners.id = profile_row.id
    RETURNING * INTO partner_row;
  END IF;

  UPDATE public.profiles
  SET role = 'partner'::public.user_role, membership_status = 'active',
    partner_code = partner_row.partner_code, updated_at = approved_time
  WHERE id = profile_row.id;

  UPDATE public.memberships
  SET partner_id = profile_row.id, membership_status = 'active'::public.membership_status, updated_at = approved_time
  WHERE id = membership_uuid;

  IF membership_row.sponsor_id IS NOT NULL AND membership_row.sponsor_id <> profile_row.id THEN
    INSERT INTO public.referral_tree (ancestor_id, descendant_id, level, locked)
    VALUES (membership_row.sponsor_id, profile_row.id, 1, true)
    ON CONFLICT (ancestor_id, descendant_id, level) DO NOTHING;

    INSERT INTO public.referral_tree (ancestor_id, descendant_id, level, locked)
    SELECT rt.ancestor_id, profile_row.id, rt.level + 1, true
    FROM public.referral_tree rt
    WHERE rt.descendant_id = membership_row.sponsor_id AND rt.level < 4 AND rt.ancestor_id <> profile_row.id
    ON CONFLICT (ancestor_id, descendant_id, level) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT partner_row.id, partner_row.partner_code, partner_row.referral_link,
    membership_row.full_name, membership_row.email, membership_row.mobile, membership_row.city, approved_time;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_approve_paid_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_approve_paid_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_approve_paid_membership(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Remove the net_amount auto-population trigger (the column itself is
--    left in place — see header note).
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_kia_set_booking_net_amount ON public.bookings;
DROP FUNCTION IF EXISTS public.kia_set_booking_net_amount();

COMMIT;

-- ============================================================================
-- Reconciliation data (from 04_RECONCILIATION_AND_SAFE_BACKFILL.sql)
-- ============================================================================
-- This rollback file deliberately does NOT automatically restore partner
-- status or wallet_balance/total_earnings/paid_earnings to their pre-04
-- values, and does NOT delete the membership commission rows 04 created.
-- Automatically reversing a financial correction is exactly the kind of
-- "silently alter ambiguous financial records" action this project is meant
-- to avoid. If you are certain you need to undo step 4's data changes,
-- restore deliberately, per partner, using the snapshot and correction-log
-- tables it created:
--
--   -- See exactly what changed:
--   SELECT * FROM public._kia_financial_repair_20260715_status_corrections;
--   SELECT * FROM public._kia_financial_repair_20260715_wallet_corrections;
--
--   -- Restore ONE partner's pre-repair values from the full snapshot, after
--   -- reviewing why (replace the uuid):
--   -- UPDATE public.partners p
--   -- SET status = s.status, wallet_balance = s.wallet_balance,
--   --     total_earnings = s.total_earnings, paid_earnings = s.paid_earnings
--   -- FROM public._kia_financial_repair_20260715_partners s
--   -- WHERE p.id = s.id AND p.id = '<partner-uuid-here>';
--
--   -- Remove the membership-commission backfill rows 04 created (only if you
--   -- are certain they should not have been generated):
--   -- DELETE FROM public.commissions
--   -- WHERE source_type = 'membership' AND status = 'pending'
--   --   AND created_at >= '2026-07-15'::date AND created_at < '2026-07-16'::date;
--
-- Snapshot tables (_kia_financial_repair_20260715_*) are never dropped by any
-- file in this package. Drop them yourself only once you are fully done
-- reviewing this repair.
-- ============================================================================
