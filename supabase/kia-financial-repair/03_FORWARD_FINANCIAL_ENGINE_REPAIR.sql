-- ============================================================================
-- KIA Skin Care - Financial Repair - Step 3: Forward engine repair
-- Date: 2026-07-15
--
-- Everything in this file is additive and safe to run more than once:
--   ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE FUNCTION, CREATE INDEX IF NOT
--   EXISTS, ALTER TABLE ... ENABLE ROW LEVEL SECURITY (always safe to re-run).
-- No table is dropped. No existing row is deleted. No existing commission,
-- payout, or partner row is rewritten by this file (that is step 4, and only
-- for the wallet-balance/status corrections you explicitly approved).
--
-- Business rules encoded here were confirmed with the project owner on
-- 2026-07-15 (see docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md section 1):
--   - Booking commissions: 4 levels, 6% / 3% / 1.7% / 1.2% (unchanged).
--   - Membership commission: flat Rs 500 to the DIRECT sponsor only (level 1),
--     when admin approves a paid membership. New in this file.
--   - Payout deduction rate: 15% (unchanged), now settings-driven.
--   - Payout minimum amount: Rs 1000 (unchanged), now settings-driven.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Preflight — refuse to run against a database missing the baseline schema
--    or the 2026-07-14 launch-helper objects this file extends. This file
--    does not attempt to recreate the entire base schema; if these checks
--    fail, run supabase/SQL_SETUP.sql, supabase/RLS_POLICIES.sql, and
--    supabase/PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql first.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commissions') THEN
    RAISE EXCEPTION 'Base schema missing (public.commissions not found). Run supabase/SQL_SETUP.sql first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    RAISE EXCEPTION 'Base schema missing (public.system_settings not found). Run supabase/SQL_SETUP.sql first.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'kia_is_admin'
  ) THEN
    RAISE EXCEPTION 'public.kia_is_admin() not found. Run supabase/PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql first.';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 1. Settings columns. All additive with safe defaults matching the values
--    already hardcoded in the app today, so behavior does not change the
--    moment this file runs — it only becomes admin-editable afterward, once
--    Phase 3 app code is deployed to read these columns.
-- ----------------------------------------------------------------------------
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS payout_deduction_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS payout_minimum_amount NUMERIC(12,2) NOT NULL DEFAULT 1000.00,
  ADD COLUMN IF NOT EXISTS membership_referral_bonus_amount NUMERIC(12,2) NOT NULL DEFAULT 500.00,
  ADD COLUMN IF NOT EXISTS payout_kyc_required BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payout_bank_required BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payout_single_open_request_only BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.system_settings.payout_deduction_rate IS 'Fraction withheld from a partner payout request, e.g. 0.15 = 15%. Confirmed value: 15%.';
COMMENT ON COLUMN public.system_settings.payout_minimum_amount IS 'Minimum wallet balance and minimum single payout request amount in rupees. Confirmed value: Rs 1000.';
COMMENT ON COLUMN public.system_settings.membership_referral_bonus_amount IS 'Flat commission paid to the direct sponsor only when a new paid membership is approved. Confirmed 2026-07-15: Rs 500, level 1 only, no 4-level split.';

-- Ensure exactly one settings row exists so app code can always .single() it.
INSERT INTO public.system_settings (maintenance_mode, payouts_enabled, commissions_enabled, bookings_enabled, membership_enabled)
SELECT false, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- ----------------------------------------------------------------------------
-- 2. Booking net-amount column. Additive; backfilled for existing rows so the
--    commission base can move from gross to net without behavior changing
--    (discount_snapshot has always been 0 to date, so net_amount = gross
--    today; this only matters once a real discount flow ships).
-- ----------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15,2);

UPDATE public.bookings
SET net_amount = GREATEST(
  0,
  COALESCE(payment_amount, final_amount, treatment_price, 0) - COALESCE(discount_snapshot, 0)
)
WHERE net_amount IS NULL;

CREATE OR REPLACE FUNCTION public.kia_set_booking_net_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.net_amount IS NULL THEN
    NEW.net_amount := GREATEST(
      0,
      COALESCE(NEW.payment_amount, NEW.final_amount, NEW.treatment_price, 0) - COALESCE(NEW.discount_snapshot, 0)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kia_set_booking_net_amount ON public.bookings;
CREATE TRIGGER trg_kia_set_booking_net_amount
BEFORE INSERT OR UPDATE OF payment_amount, final_amount, treatment_price, discount_snapshot, net_amount
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.kia_set_booking_net_amount();

-- ----------------------------------------------------------------------------
-- 3. Canonical commission idempotency protection. Reuse whatever unique
--    constraint/index already exists (the base SQL_SETUP.sql UNIQUE
--    constraint, or either of the two same-shape partial indexes added by
--    later migrations) — only create a new one if genuinely none exist, and
--    always ensure the specific partial-index shape
--    "(source_type, source_id, partner_id, level) WHERE deleted_at IS NULL"
--    is present, because the RPCs below target that exact shape in their
--    ON CONFLICT clauses.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT 1
    FROM public.commissions
    WHERE deleted_at IS NULL
    GROUP BY source_type, source_id, partner_id, level
    HAVING COUNT(*) > 1
  ) dupes;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Cannot create the commission idempotency index: % duplicate (source_type, source_id, partner_id, level) group(s) already exist among non-deleted commission rows. Run 01_READ_ONLY_LIVE_DIAGNOSTICS.sql section 5 to see them, resolve manually, then re-run this file.',
      duplicate_count;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS commissions_source_partner_level_active_uidx
ON public.commissions (source_type, source_id, partner_id, level)
WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Canonical kia_is_admin(). Reconciles the two divergent definitions that
--    existed (one with 'staff', one without) into a single source of truth.
--    Identical body to PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql's version.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = check_user_id
        AND p.role IN ('admin'::public.user_role, 'staff'::public.user_role, 'super_admin'::public.user_role)
    )
    OR EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = check_user_id
        AND lower(u.email) = 'supportkiaskincare@gmail.com'
    );
$$;

REVOKE ALL ON FUNCTION public.kia_is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_is_admin(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. kia_generate_booking_commissions — unchanged eligibility/level logic,
--    now reads bookings.net_amount as the commission base (falls back to the
--    same gross-amount chain if net_amount is somehow null, so this is a
--    strict hardening, not a behavior change while discount stays at 0).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_generate_booking_commissions(booking_uuid uuid)
RETURNS TABLE(
  id uuid,
  source_id uuid,
  partner_id uuid,
  level integer,
  percentage numeric,
  amount numeric,
  status public.commission_status,
  created_at timestamptz
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

  SELECT *
  INTO booking_row
  FROM public.bookings
  WHERE id = booking_uuid
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF booking_row.payment_status::text <> 'paid'
     OR booking_row.booking_status::text NOT IN ('confirmed', 'completed') THEN
    RETURN;
  END IF;

  source_amount := COALESCE(
    booking_row.net_amount,
    booking_row.payment_amount,
    booking_row.final_amount,
    booking_row.treatment_price,
    0
  );

  IF source_amount <= 0 THEN
    RETURN;
  END IF;

  source_partner_id := booking_row.referred_by;

  IF source_partner_id IS NULL AND COALESCE(booking_row.referral_code, booking_row.partner_code) IS NOT NULL THEN
    SELECT p.id
    INTO source_partner_id
    FROM public.partners p
    WHERE upper(p.partner_code) = upper(COALESCE(booking_row.referral_code, booking_row.partner_code))
      AND p.status = 'active'::public.partner_status
      AND COALESCE(p.is_active, true) = true
      AND p.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF source_partner_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(cs.level_1_percentage, 6),
    COALESCE(cs.level_2_percentage, 3),
    COALESCE(cs.level_3_percentage, 1.7),
    COALESCE(cs.level_4_percentage, 1.2)
  INTO level_1_rate, level_2_rate, level_3_rate, level_4_rate
  FROM public.commission_settings cs
  WHERE cs.active = true
  ORDER BY cs.updated_at DESC NULLS LAST
  LIMIT 1;

  level_1_rate := COALESCE(level_1_rate, 6);
  level_2_rate := COALESCE(level_2_rate, 3);
  level_3_rate := COALESCE(level_3_rate, 1.7);
  level_4_rate := COALESCE(level_4_rate, 1.2);

  RETURN QUERY
  WITH RECURSIVE sponsor_chain(partner_id, earning_level, path) AS (
    SELECT
      p.sponsor_id,
      1,
      ARRAY[p.id]
    FROM public.partners p
    WHERE p.id = source_partner_id
      AND p.sponsor_id IS NOT NULL
      AND p.sponsor_id <> p.id

    UNION ALL

    SELECT
      parent.sponsor_id,
      sponsor_chain.earning_level + 1,
      sponsor_chain.path || sponsor_chain.partner_id
    FROM sponsor_chain
    JOIN public.partners parent ON parent.id = sponsor_chain.partner_id
    WHERE sponsor_chain.earning_level < 4
      AND parent.sponsor_id IS NOT NULL
      AND parent.sponsor_id <> ALL(sponsor_chain.path)
      AND parent.sponsor_id <> source_partner_id
  ),
  eligible_chain AS (
    SELECT DISTINCT ON (sponsor_chain.partner_id, sponsor_chain.earning_level)
      sponsor_chain.partner_id,
      sponsor_chain.earning_level,
      CASE sponsor_chain.earning_level
        WHEN 1 THEN level_1_rate
        WHEN 2 THEN level_2_rate
        WHEN 3 THEN level_3_rate
        WHEN 4 THEN level_4_rate
        ELSE 0
      END AS earning_percentage
    FROM sponsor_chain
    JOIN public.partners p ON p.id = sponsor_chain.partner_id
    WHERE sponsor_chain.partner_id IS NOT NULL
      AND sponsor_chain.earning_level BETWEEN 1 AND 4
      AND p.status = 'active'::public.partner_status
      AND COALESCE(p.is_active, true) = true
      AND p.deleted_at IS NULL
      AND (
        p.membership_expires_at IS NULL
        OR p.membership_expires_at >= now()
      )
    ORDER BY sponsor_chain.partner_id, sponsor_chain.earning_level
  )
  INSERT INTO public.commissions (
    partner_id,
    source_type,
    source_id,
    source_amount,
    level,
    percentage,
    amount,
    status,
    reversed,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    eligible_chain.partner_id,
    'booking'::public.source_type,
    booking_row.id,
    source_amount,
    eligible_chain.earning_level,
    eligible_chain.earning_percentage,
    ROUND(source_amount * eligible_chain.earning_percentage / 100, 2),
    'pending'::public.commission_status,
    false,
    true,
    now(),
    now()
  FROM eligible_chain
  WHERE eligible_chain.earning_percentage > 0
  ON CONFLICT (source_type, source_id, partner_id, level)
    WHERE deleted_at IS NULL
    DO NOTHING
  RETURNING
    commissions.id,
    commissions.source_id,
    commissions.partner_id,
    commissions.level,
    commissions.percentage,
    commissions.amount,
    commissions.status,
    commissions.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_generate_booking_commissions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_generate_booking_commissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_generate_booking_commissions(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 6. kia_approve_paid_membership — identical to
--    PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql's version, PLUS the new flat
--    membership commission to the direct sponsor confirmed 2026-07-15.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_approve_paid_membership(membership_uuid uuid)
RETURNS TABLE(
  partner_id uuid,
  partner_code text,
  referral_link text,
  full_name text,
  email text,
  phone text,
  city text,
  approved_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  membership_row public.memberships%ROWTYPE;
  profile_row public.profiles%ROWTYPE;
  partner_row public.partners%ROWTYPE;
  sponsor_row public.partners%ROWTYPE;
  bonus_amount numeric := 500;
  approved_time timestamptz := now();
  expires_time timestamptz := now() + interval '1 year';
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     AND NOT public.kia_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT *
  INTO membership_row
  FROM public.memberships
  WHERE id = membership_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF membership_row.payment_status <> 'paid'::public.payment_status THEN
    RAISE EXCEPTION 'Payment must be marked paid before approval';
  END IF;

  IF membership_row.membership_status = 'rejected'::public.membership_status THEN
    RAISE EXCEPTION 'Rejected membership cannot be approved';
  END IF;

  SELECT *
  INTO profile_row
  FROM public.profiles
  WHERE id = membership_row.partner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Linked profile/auth user not found for membership %', membership_uuid;
  END IF;

  SELECT *
  INTO partner_row
  FROM public.partners
  WHERE id = profile_row.id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.partners (
      id, partner_code, city, address, pin_code, sponsor_id, status,
      wallet_balance, total_earnings, paid_earnings,
      membership_purchased_at, membership_started_at, membership_expires_at,
      is_active, created_at, updated_at
    )
    VALUES (
      profile_row.id, null, membership_row.city, membership_row.address, membership_row.pin_code,
      membership_row.sponsor_id, 'active'::public.partner_status,
      0, 0, 0,
      approved_time, approved_time, expires_time,
      true, approved_time, approved_time
    )
    RETURNING * INTO partner_row;
  ELSE
    UPDATE public.partners
    SET
      status = 'active'::public.partner_status,
      is_active = true,
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
  SET
    role = 'partner'::public.user_role,
    membership_status = 'active',
    partner_code = partner_row.partner_code,
    updated_at = approved_time
  WHERE id = profile_row.id;

  UPDATE public.memberships
  SET
    partner_id = profile_row.id,
    membership_status = 'active'::public.membership_status,
    updated_at = approved_time
  WHERE id = membership_uuid;

  IF membership_row.sponsor_id IS NOT NULL AND membership_row.sponsor_id <> profile_row.id THEN
    INSERT INTO public.referral_tree (ancestor_id, descendant_id, level, locked)
    VALUES (membership_row.sponsor_id, profile_row.id, 1, true)
    ON CONFLICT (ancestor_id, descendant_id, level) DO NOTHING;

    INSERT INTO public.referral_tree (ancestor_id, descendant_id, level, locked)
    SELECT rt.ancestor_id, profile_row.id, rt.level + 1, true
    FROM public.referral_tree rt
    WHERE rt.descendant_id = membership_row.sponsor_id
      AND rt.level < 4
      AND rt.ancestor_id <> profile_row.id
    ON CONFLICT (ancestor_id, descendant_id, level) DO NOTHING;

    -- --------------------------------------------------------------------
    -- New 2026-07-15: flat membership referral bonus to the DIRECT sponsor
    -- only (level 1 of the source_type='membership' ledger). Confirmed by
    -- the project owner: no 2/3/4-level split for membership, unlike
    -- bookings. Amount is settings-driven (system_settings), defaults to
    -- Rs 500. Sponsor must be an active, non-expired partner — same
    -- eligibility rule used for booking commissions. Generated as
    -- 'pending', same lifecycle as booking commissions (admin must approve
    -- before it credits the sponsor's wallet).
    -- --------------------------------------------------------------------
    SELECT * INTO sponsor_row FROM public.partners WHERE id = membership_row.sponsor_id;

    IF FOUND
       AND sponsor_row.status = 'active'::public.partner_status
       AND COALESCE(sponsor_row.is_active, true) = true
       AND sponsor_row.deleted_at IS NULL
       AND (sponsor_row.membership_expires_at IS NULL OR sponsor_row.membership_expires_at >= approved_time)
    THEN
      SELECT COALESCE(ss.membership_referral_bonus_amount, 500)
      INTO bonus_amount
      FROM public.system_settings ss
      ORDER BY ss.updated_at DESC NULLS LAST
      LIMIT 1;
      bonus_amount := COALESCE(bonus_amount, 500);

      IF bonus_amount > 0 THEN
        INSERT INTO public.commissions (
          partner_id, source_type, source_id, source_amount, level, percentage, amount,
          status, reversed, is_active, created_at, updated_at
        )
        VALUES (
          membership_row.sponsor_id, 'membership'::public.source_type, membership_uuid,
          COALESCE(membership_row.amount, 0), 1, 0, bonus_amount,
          'pending'::public.commission_status, false, true, approved_time, approved_time
        )
        ON CONFLICT (source_type, source_id, partner_id, level)
          WHERE deleted_at IS NULL
          DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    partner_row.id,
    partner_row.partner_code,
    partner_row.referral_link,
    membership_row.full_name,
    membership_row.email,
    membership_row.mobile,
    membership_row.city,
    approved_time;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_approve_paid_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_approve_paid_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_approve_paid_membership(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 7. NEW: kia_set_commission_status — atomic, row-locked commission
--    approve/reject, replacing the unlocked read-then-write JS pattern in
--    lib/actions/commissions.ts. Mirrors the proven locking pattern already
--    used by process_partner_payout (MIGRATION_FINAL_CLIENT_HANDOVER_2026_06_13.sql).
--    Idempotent: re-requesting the same target status on a commission already
--    in that status is a no-op (matches the existing JS guard behavior).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_set_commission_status(
  commission_id_input uuid,
  new_status_input text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commission_row public.commissions%ROWTYPE;
  partner_row public.partners%ROWTYPE;
  balance_before numeric;
  balance_after numeric;
  commission_amount numeric;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     AND NOT public.kia_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF new_status_input NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Unsupported commission status: %', new_status_input;
  END IF;

  SELECT * INTO commission_row FROM public.commissions WHERE id = commission_id_input FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commission not found';
  END IF;

  -- Idempotent no-op: already in the requested state.
  IF commission_row.status::text = new_status_input THEN
    RETURN to_jsonb(commission_row);
  END IF;

  IF commission_row.status = 'paid'::public.commission_status THEN
    RAISE EXCEPTION 'This commission has already been paid out and cannot change status.';
  END IF;

  commission_amount := COALESCE(commission_row.amount, 0);

  IF new_status_input = 'approved' THEN
    IF commission_row.status <> 'pending'::public.commission_status THEN
      RAISE EXCEPTION 'A % commission cannot be approved.', commission_row.status;
    END IF;

    IF commission_amount > 0 THEN
      SELECT * INTO partner_row FROM public.partners WHERE id = commission_row.partner_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Partner wallet could not be loaded.';
      END IF;

      balance_before := COALESCE(partner_row.wallet_balance, 0);
      balance_after := balance_before + commission_amount;

      UPDATE public.partners
      SET
        wallet_balance = balance_after,
        total_earnings = COALESCE(total_earnings, 0) + commission_amount,
        updated_at = now()
      WHERE id = commission_row.partner_id;

      INSERT INTO public.wallet_transactions (
        partner_id, transaction_type, amount, balance_before, balance_after,
        reference_type, reference_id, notes, created_by
      ) VALUES (
        commission_row.partner_id, 'commission_credit', commission_amount, balance_before, balance_after,
        'commission', commission_row.id,
        format('Commission level %s approved', COALESCE(commission_row.level, 1)),
        auth.uid()
      );
    END IF;

    UPDATE public.commissions
    SET status = 'approved'::public.commission_status, reversed = false, updated_at = now()
    WHERE id = commission_id_input
    RETURNING * INTO commission_row;

  ELSIF new_status_input = 'rejected' THEN
    IF commission_row.status NOT IN ('pending'::public.commission_status, 'approved'::public.commission_status) THEN
      RAISE EXCEPTION 'A % commission cannot be rejected.', commission_row.status;
    END IF;

    IF commission_row.status = 'approved'::public.commission_status AND commission_amount > 0 THEN
      SELECT * INTO partner_row FROM public.partners WHERE id = commission_row.partner_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Partner wallet could not be loaded.';
      END IF;

      balance_before := COALESCE(partner_row.wallet_balance, 0);
      IF balance_before + 0.009 < commission_amount THEN
        RAISE EXCEPTION 'Cannot reverse this commission: the amount has already been withdrawn from the wallet.';
      END IF;
      balance_after := GREATEST(0, balance_before - commission_amount);

      UPDATE public.partners
      SET
        wallet_balance = balance_after,
        total_earnings = GREATEST(0, COALESCE(total_earnings, 0) - commission_amount),
        updated_at = now()
      WHERE id = commission_row.partner_id;

      INSERT INTO public.wallet_transactions (
        partner_id, transaction_type, amount, balance_before, balance_after,
        reference_type, reference_id, notes, created_by
      ) VALUES (
        commission_row.partner_id, 'adjustment_debit', commission_amount, balance_before, balance_after,
        'commission', commission_row.id,
        format('Commission level %s rejected/reversed', COALESCE(commission_row.level, 1)),
        auth.uid()
      );
    END IF;

    UPDATE public.commissions
    SET status = 'rejected'::public.commission_status, reversed = true, reversed_at = now(), updated_at = now()
    WHERE id = commission_id_input
    RETURNING * INTO commission_row;

  ELSIF new_status_input = 'pending' THEN
    RAISE EXCEPTION 'A % commission cannot be reset to pending.', commission_row.status;
  END IF;

  INSERT INTO public.activity_logs (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(), 'admin', 'commission_status_changed', 'commission', commission_row.id,
    jsonb_build_object('status', commission_row.status),
    jsonb_build_object('status', new_status_input)
  );

  RETURN to_jsonb(commission_row);
END;
$$;

REVOKE ALL ON FUNCTION public.kia_set_commission_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_set_commission_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_set_commission_status(uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 8. Re-assert Row-Level Security on every financial/identity table. This is
--    always safe to run even if RLS is already enabled — it is a no-op in
--    that case. This directly closes finding B1 (FIX_RLS_RECURSION.sql may
--    have disabled RLS on these tables with nothing since re-enabling it).
--    Policies are re-created with DROP POLICY IF EXISTS + CREATE POLICY so
--    this is safe to re-run regardless of what policies currently exist.
--    All admin checks use the non-recursive kia_is_admin() helper.
-- ----------------------------------------------------------------------------
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- partners: partner can read/update only their own row; admin can read/update all.
DROP POLICY IF EXISTS "partners_select_own_or_admin" ON public.partners;
CREATE POLICY "partners_select_own_or_admin" ON public.partners
  FOR SELECT USING (auth.uid() = id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "partners_admin_write" ON public.partners;
CREATE POLICY "partners_admin_write" ON public.partners
  FOR UPDATE USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "partners_no_public_insert" ON public.partners;
CREATE POLICY "partners_no_public_insert" ON public.partners
  FOR INSERT WITH CHECK (public.kia_is_admin(auth.uid()) OR current_setting('request.jwt.claim.role', true) = 'service_role');

-- commissions: partner can read only their own rows; only admin/service-role writes.
DROP POLICY IF EXISTS "commissions_select_own_or_admin" ON public.commissions;
CREATE POLICY "commissions_select_own_or_admin" ON public.commissions
  FOR SELECT USING (auth.uid() = partner_id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "commissions_no_direct_write" ON public.commissions;
CREATE POLICY "commissions_no_direct_write" ON public.commissions
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- payouts: partner can read/create only their own rows; only admin updates status.
DROP POLICY IF EXISTS "payouts_select_own_or_admin" ON public.payouts;
CREATE POLICY "payouts_select_own_or_admin" ON public.payouts
  FOR SELECT USING (auth.uid() = partner_id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "payouts_partner_create_own" ON public.payouts;
CREATE POLICY "payouts_partner_create_own" ON public.payouts
  FOR INSERT WITH CHECK (auth.uid() = partner_id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "payouts_admin_update" ON public.payouts;
CREATE POLICY "payouts_admin_update" ON public.payouts
  FOR UPDATE USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- wallet_transactions: partner can read only their own rows; no direct client writes.
DROP POLICY IF EXISTS "wallet_transactions_select_own_or_admin" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_own_or_admin" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = partner_id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "wallet_transactions_admin_only_write" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_admin_only_write" ON public.wallet_transactions
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- memberships: sponsor/self can read own; admin reads/writes all.
DROP POLICY IF EXISTS "memberships_select_own_or_admin" ON public.memberships;
CREATE POLICY "memberships_select_own_or_admin" ON public.memberships
  FOR SELECT USING (auth.uid() = partner_id OR auth.uid() = sponsor_id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "memberships_admin_write" ON public.memberships;
CREATE POLICY "memberships_admin_write" ON public.memberships
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- bookings: referring partner can read their own sourced bookings; admin all.
DROP POLICY IF EXISTS "bookings_select_own_or_admin" ON public.bookings;
CREATE POLICY "bookings_select_own_or_admin" ON public.bookings
  FOR SELECT USING (auth.uid() = referred_by OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "bookings_admin_write" ON public.bookings;
CREATE POLICY "bookings_admin_write" ON public.bookings
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- referral_tree: partner can see their own ancestor/descendant rows; admin all.
DROP POLICY IF EXISTS "referral_tree_select_own_or_admin" ON public.referral_tree;
CREATE POLICY "referral_tree_select_own_or_admin" ON public.referral_tree
  FOR SELECT USING (auth.uid() = ancestor_id OR auth.uid() = descendant_id OR public.kia_is_admin(auth.uid()));
DROP POLICY IF EXISTS "referral_tree_admin_write" ON public.referral_tree;
CREATE POLICY "referral_tree_admin_write" ON public.referral_tree
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- admins: admin-only, no partner/customer access at all.
DROP POLICY IF EXISTS "admins_admin_only" ON public.admins;
CREATE POLICY "admins_admin_only" ON public.admins
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

-- commission_settings / system_settings: readable by any authenticated user
-- (needed for public rate/settings display), writable by admin only.
DROP POLICY IF EXISTS "commission_settings_read_all" ON public.commission_settings;
CREATE POLICY "commission_settings_read_all" ON public.commission_settings
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "commission_settings_admin_write" ON public.commission_settings;
CREATE POLICY "commission_settings_admin_write" ON public.commission_settings
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "system_settings_read_all" ON public.system_settings;
CREATE POLICY "system_settings_read_all" ON public.system_settings
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "system_settings_admin_write" ON public.system_settings;
CREATE POLICY "system_settings_admin_write" ON public.system_settings
  FOR ALL USING (public.kia_is_admin(auth.uid())) WITH CHECK (public.kia_is_admin(auth.uid()));

COMMIT;

-- ============================================================================
-- Verification queries (run these after COMMIT, or use 05_POST_MIGRATION_VALIDATION.sql)
-- ============================================================================
-- SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND proname IN
--   ('kia_is_admin','kia_generate_booking_commissions','kia_approve_paid_membership','kia_set_commission_status');
-- SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND relname IN
--   ('partners','commissions','payouts','wallet_transactions','bookings','memberships','referral_tree','admins');
-- SELECT payout_deduction_rate, payout_minimum_amount, membership_referral_bonus_amount FROM public.system_settings LIMIT 1;
