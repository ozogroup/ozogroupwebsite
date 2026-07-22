-- ============================================================================
-- MIGRATION: Membership Approval Fix — 2026-07-22
-- ============================================================================
-- Fixes "column reference 'partner_id' is ambiguous" error during membership
-- approval by fully qualifying every column reference in the RPC.
--
-- Also ensures the RPC exists (CREATE OR REPLACE) so approval never falls
-- back to the non-atomic JS path.
--
-- Safety: CREATE OR REPLACE only. No DDL changes. No data modifications.
-- ============================================================================

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
  m_row  public.memberships%ROWTYPE;
  pr_row public.profiles%ROWTYPE;
  pa_row public.partners%ROWTYPE;
  approved_time timestamptz := now();
  expires_time  timestamptz := now() + interval '1 year';
BEGIN
  -- ── Auth check ──────────────────────────────────────────────────
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     AND NOT public.kia_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- ── Lock and validate the membership row ────────────────────────
  SELECT m.* INTO m_row
    FROM public.memberships m
   WHERE m.id = membership_uuid
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF m_row.payment_status <> 'paid'::public.payment_status THEN
    RAISE EXCEPTION 'Payment must be marked paid before approval';
  END IF;

  IF m_row.membership_status = 'rejected'::public.membership_status THEN
    RAISE EXCEPTION 'Rejected membership cannot be approved';
  END IF;

  -- Already approved — return idempotently
  IF m_row.membership_status = 'active'::public.membership_status THEN
    RETURN QUERY
    SELECT pa.id, pa.partner_code, pa.referral_link,
           m_row.full_name, m_row.email, m_row.mobile, m_row.city,
           approved_time
      FROM public.partners pa
     WHERE pa.id = m_row.partner_id
     LIMIT 1;
    RETURN;
  END IF;

  -- ── Lock the profile row ────────────────────────────────────────
  SELECT p.* INTO pr_row
    FROM public.profiles p
   WHERE p.id = m_row.partner_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Linked profile/auth user not found for membership %', membership_uuid;
  END IF;

  -- ── Create or activate the partner ──────────────────────────────
  SELECT pa.* INTO pa_row
    FROM public.partners pa
   WHERE pa.id = pr_row.id
     FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.partners (
      id, partner_code, city, address, pin_code, sponsor_id,
      status, wallet_balance, total_earnings, paid_earnings,
      membership_purchased_at, membership_started_at, membership_expires_at,
      is_active, created_at, updated_at
    ) VALUES (
      pr_row.id, null, m_row.city, m_row.address, m_row.pin_code,
      m_row.sponsor_id,
      'active'::public.partner_status, 0, 0, 0,
      approved_time, approved_time, expires_time,
      true, approved_time, approved_time
    )
    RETURNING * INTO pa_row;
  ELSE
    UPDATE public.partners pa_upd
       SET status                 = 'active'::public.partner_status,
           is_active              = true,
           sponsor_id             = COALESCE(pa_upd.sponsor_id, m_row.sponsor_id),
           city                   = COALESCE(NULLIF(pa_upd.city, ''), m_row.city),
           address                = COALESCE(NULLIF(pa_upd.address, ''), m_row.address),
           pin_code               = COALESCE(NULLIF(pa_upd.pin_code, ''), m_row.pin_code),
           membership_purchased_at = COALESCE(pa_upd.membership_purchased_at, approved_time),
           membership_started_at  = COALESCE(pa_upd.membership_started_at, approved_time),
           membership_expires_at  = COALESCE(pa_upd.membership_expires_at, expires_time),
           updated_at             = approved_time
     WHERE pa_upd.id = pr_row.id
    RETURNING * INTO pa_row;
  END IF;

  -- ── Update profile role ─────────────────────────────────────────
  UPDATE public.profiles p_upd
     SET role              = 'partner'::public.user_role,
         membership_status = 'active',
         partner_code      = pa_row.partner_code,
         updated_at        = approved_time
   WHERE p_upd.id = pr_row.id;

  -- ── Mark membership as active ───────────────────────────────────
  UPDATE public.memberships m_upd
     SET partner_id        = pr_row.id,
         membership_status = 'active'::public.membership_status,
         updated_at        = approved_time
   WHERE m_upd.id = membership_uuid;

  -- ── Build referral tree ─────────────────────────────────────────
  IF m_row.sponsor_id IS NOT NULL AND m_row.sponsor_id <> pr_row.id THEN
    INSERT INTO public.referral_tree (ancestor_id, descendant_id, level, locked)
    VALUES (m_row.sponsor_id, pr_row.id, 1, true)
    ON CONFLICT (ancestor_id, descendant_id, level) DO NOTHING;

    INSERT INTO public.referral_tree (ancestor_id, descendant_id, level, locked)
    SELECT rt.ancestor_id, pr_row.id, rt.level + 1, true
      FROM public.referral_tree rt
     WHERE rt.descendant_id = m_row.sponsor_id
       AND rt.level < 4
       AND rt.ancestor_id <> pr_row.id
    ON CONFLICT (ancestor_id, descendant_id, level) DO NOTHING;
  END IF;

  -- ── Return the result ───────────────────────────────────────────
  RETURN QUERY
  SELECT
    pa_row.id,
    pa_row.partner_code,
    pa_row.referral_link,
    m_row.full_name,
    m_row.email,
    m_row.mobile,
    m_row.city,
    approved_time;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_approve_paid_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_approve_paid_membership(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_approve_paid_membership(uuid) TO service_role;

SELECT 'migration_membership_approval_fix_2026_07_22_ready' AS status;
