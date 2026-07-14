-- ============================================================================
-- KIA Skin Care - Focused Launch Helper Restore Patch
-- Date: 2026-07-14
--
-- Purpose:
--   Restore missing helper functions, triggers, and non-recursive policies after
--   the launch repair data/columns were applied but helper objects were removed.
--
-- Safety contract:
--   * No production rows are deleted.
--   * No existing IDs are overwritten or backfilled.
--   * No Auth users are created, deleted, or password-reset.
--   * No snapshot tables are created.
--   * No broad RLS disable.
--   * Safe to run repeatedly.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Preflight: required columns already exist from the approved migration.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'membership_id'
  ) THEN
    RAISE EXCEPTION 'Required column public.memberships.membership_id is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'booking_id'
  ) THEN
    RAISE EXCEPTION 'Required column public.bookings.booking_id is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'treatment_order_id'
  ) THEN
    RAISE EXCEPTION 'Required column public.bookings.treatment_order_id is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referral_tree' AND column_name = 'referral_transaction_id'
  ) THEN
    RAISE EXCEPTION 'Required column public.referral_tree.referral_transaction_id is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'commissions' AND column_name = 'referral_transaction_id'
  ) THEN
    RAISE EXCEPTION 'Required column public.commissions.referral_transaction_id is missing';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 1. Non-recursive admin authorization helper.
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
-- 2. Database-generated ID helpers.
--    Sequences are advanced to at least the highest existing live value.
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.kia_partner_code_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.kia_membership_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS public.kia_booking_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS public.kia_treatment_order_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS public.kia_referral_transaction_id_seq START WITH 100001;

SELECT setval(
  'public.kia_partner_code_seq',
  GREATEST(
    1000,
    COALESCE((
      SELECT MAX(substring(upper(partner_code) FROM '[0-9]+')::bigint)
      FROM public.partners
      WHERE partner_code ~* '^(KIA|OZO)[0-9]+$'
    ), 1000)
  ),
  true
);

SELECT setval(
  'public.kia_membership_id_seq',
  GREATEST(
    100000,
    COALESCE((
      SELECT MAX(substring(membership_id FROM 5)::bigint)
      FROM public.memberships
      WHERE membership_id ~ '^KIAM[0-9]+$'
    ), 100000)
  ),
  true
);

SELECT setval(
  'public.kia_booking_id_seq',
  GREATEST(
    100000,
    COALESCE((
      SELECT MAX(substring(booking_id FROM 5)::bigint)
      FROM public.bookings
      WHERE booking_id ~ '^KIAB[0-9]+$'
    ), 100000)
  ),
  true
);

SELECT setval(
  'public.kia_treatment_order_id_seq',
  GREATEST(
    100000,
    COALESCE((
      SELECT MAX(substring(treatment_order_id FROM 5)::bigint)
      FROM public.bookings
      WHERE treatment_order_id ~ '^KIAT[0-9]+$'
    ), 100000)
  ),
  true
);

SELECT setval(
  'public.kia_referral_transaction_id_seq',
  GREATEST(
    100000,
    COALESCE((
      SELECT MAX(value)
      FROM (
        SELECT substring(referral_transaction_id FROM 5)::bigint AS value
        FROM public.referral_tree
        WHERE referral_transaction_id ~ '^KIAR[0-9]+$'
        UNION ALL
        SELECT substring(referral_transaction_id FROM 5)::bigint AS value
        FROM public.commissions
        WHERE referral_transaction_id ~ '^KIAR[0-9]+$'
      ) ids
    ), 100000)
  ),
  true
);

CREATE OR REPLACE FUNCTION public.kia_next_partner_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := 'KIA' || nextval('public.kia_partner_code_seq')::text;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.partners WHERE upper(partner_code) = upper(candidate)
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.kia_next_membership_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'KIAM' || nextval('public.kia_membership_id_seq')::text;
$$;

CREATE OR REPLACE FUNCTION public.kia_next_booking_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'KIAB' || nextval('public.kia_booking_id_seq')::text;
$$;

CREATE OR REPLACE FUNCTION public.kia_next_treatment_order_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'KIAT' || nextval('public.kia_treatment_order_id_seq')::text;
$$;

CREATE OR REPLACE FUNCTION public.kia_next_referral_transaction_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'KIAR' || nextval('public.kia_referral_transaction_id_seq')::text;
$$;

-- ----------------------------------------------------------------------------
-- 3. ID assignment triggers for future inserts only.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_assign_membership_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_id IS NULL OR btrim(NEW.membership_id) = '' THEN
    NEW.membership_id := public.kia_next_membership_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kia_assign_membership_id ON public.memberships;
CREATE TRIGGER trg_kia_assign_membership_id
BEFORE INSERT ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.kia_assign_membership_id();

CREATE OR REPLACE FUNCTION public.kia_assign_booking_ids()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_id IS NULL OR btrim(NEW.booking_id) = '' THEN
    NEW.booking_id := public.kia_next_booking_id();
  END IF;
  IF NEW.treatment_order_id IS NULL OR btrim(NEW.treatment_order_id) = '' THEN
    NEW.treatment_order_id := public.kia_next_treatment_order_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kia_assign_booking_ids ON public.bookings;
CREATE TRIGGER trg_kia_assign_booking_ids
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.kia_assign_booking_ids();

CREATE OR REPLACE FUNCTION public.kia_assign_partner_code_on_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active'::public.partner_status
     AND (NEW.partner_code IS NULL OR btrim(NEW.partner_code) = '') THEN
    NEW.partner_code := public.kia_next_partner_code();
  END IF;

  IF NEW.partner_code IS NOT NULL AND btrim(NEW.partner_code) <> '' THEN
    NEW.partner_code := upper(btrim(NEW.partner_code));
    NEW.referral_link := COALESCE(
      NULLIF(NEW.referral_link, ''),
      'https://www.kiaskincare.com/' || NEW.partner_code
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kia_assign_partner_code_on_activation ON public.partners;
CREATE TRIGGER trg_kia_assign_partner_code_on_activation
BEFORE INSERT OR UPDATE OF status, partner_code ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.kia_assign_partner_code_on_activation();

CREATE OR REPLACE FUNCTION public.kia_assign_referral_transaction_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_transaction_id IS NULL OR btrim(NEW.referral_transaction_id) = '' THEN
    NEW.referral_transaction_id := public.kia_next_referral_transaction_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kia_assign_referral_tree_transaction_id ON public.referral_tree;
CREATE TRIGGER trg_kia_assign_referral_tree_transaction_id
BEFORE INSERT ON public.referral_tree
FOR EACH ROW
EXECUTE FUNCTION public.kia_assign_referral_transaction_id();

DROP TRIGGER IF EXISTS trg_kia_assign_commission_referral_transaction_id ON public.commissions;
CREATE TRIGGER trg_kia_assign_commission_referral_transaction_id
BEFORE INSERT ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.kia_assign_referral_transaction_id();

-- ----------------------------------------------------------------------------
-- 4. Safe referral lookup helper. Returns only non-sensitive display fields.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_lookup_referrer(raw_code text)
RETURNS TABLE(valid boolean, partner_name text, partner_code text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text := upper(btrim(COALESCE(raw_code, '')));
BEGIN
  IF normalized_code = '' THEN
    RETURN QUERY SELECT false, ''::text, ''::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    true AS valid,
    COALESCE(NULLIF(pf.full_name, ''), 'KIA Partner') AS partner_name,
    p.partner_code
  FROM public.partners p
  LEFT JOIN public.profiles pf ON pf.id = p.id
  WHERE upper(p.partner_code) = normalized_code
    AND p.status = 'active'::public.partner_status
    AND COALESCE(p.is_active, true) = true
    AND p.deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ''::text, normalized_code;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_lookup_referrer(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_lookup_referrer(text) TO anon;
GRANT EXECUTE ON FUNCTION public.kia_lookup_referrer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_lookup_referrer(text) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. Atomic paid-membership approval RPC.
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
      id,
      partner_code,
      city,
      address,
      pin_code,
      sponsor_id,
      status,
      wallet_balance,
      total_earnings,
      paid_earnings,
      membership_purchased_at,
      membership_started_at,
      membership_expires_at,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      profile_row.id,
      null,
      membership_row.city,
      membership_row.address,
      membership_row.pin_code,
      membership_row.sponsor_id,
      'active'::public.partner_status,
      0,
      0,
      0,
      approved_time,
      approved_time,
      expires_time,
      true,
      approved_time,
      approved_time
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
-- 6. Non-recursive RLS policies.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_no_public_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_full" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.kia_is_admin(auth.uid()));

CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
USING (
  public.kia_is_admin(auth.uid())
  OR (
    auth.uid() = id
    AND role IN ('customer'::public.user_role, 'partner'::public.user_role)
  )
)
WITH CHECK (
  public.kia_is_admin(auth.uid())
  OR (
    auth.uid() = id
    AND role IN ('customer'::public.user_role, 'partner'::public.user_role)
  )
);

CREATE POLICY "profiles_insert_admin"
ON public.profiles
FOR INSERT
WITH CHECK (public.kia_is_admin(auth.uid()));

ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_settings_public_read" ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_content_manager_write" ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_admin_write" ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_super_admin_full" ON public.contact_settings;
DROP POLICY IF EXISTS public_read_contact_settings ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_admin_all" ON public.contact_settings;

CREATE POLICY public_read_contact_settings
ON public.contact_settings
FOR SELECT
USING (true);

CREATE POLICY "contact_settings_admin_all"
ON public.contact_settings
FOR ALL
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

-- Replace recursive admin operational policies with the single helper.
DROP POLICY IF EXISTS "partners_admin_read_all" ON public.partners;
DROP POLICY IF EXISTS "partners_admin_update_limited" ON public.partners;
CREATE POLICY "partners_admin_read_all"
ON public.partners
FOR SELECT
USING (public.kia_is_admin(auth.uid()));
CREATE POLICY "partners_admin_update_limited"
ON public.partners
FOR UPDATE
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "memberships_admin_read_all" ON public.memberships;
DROP POLICY IF EXISTS "memberships_admin_write" ON public.memberships;
CREATE POLICY "memberships_admin_read_all"
ON public.memberships
FOR SELECT
USING (public.kia_is_admin(auth.uid()));
CREATE POLICY "memberships_admin_write"
ON public.memberships
FOR ALL
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "bookings_admin_read_all" ON public.bookings;
DROP POLICY IF EXISTS "bookings_admin_write" ON public.bookings;
CREATE POLICY "bookings_admin_read_all"
ON public.bookings
FOR SELECT
USING (public.kia_is_admin(auth.uid()));
CREATE POLICY "bookings_admin_write"
ON public.bookings
FOR ALL
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

COMMIT;

-- ============================================================================
-- Verification queries
-- ============================================================================
-- 1. Functions restored:
-- SELECT n.nspname AS schema, p.proname, pg_get_function_identity_arguments(p.oid) AS args
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname LIKE 'kia_%'
-- ORDER BY p.proname;
--
-- 2. Triggers restored:
-- SELECT event_object_table, trigger_name, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public' AND trigger_name LIKE 'trg_kia_%'
-- ORDER BY event_object_table, trigger_name;
--
-- 3. Focused policies:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('profiles','contact_settings','partners','memberships','bookings')
-- ORDER BY tablename, policyname;
--
-- 4. Helper behavior:
-- SELECT public.kia_is_admin(id) AS support_is_admin
-- FROM auth.users
-- WHERE lower(email) = 'supportkiaskincare@gmail.com';
--
-- 5. Referral lookup:
-- SELECT * FROM public.kia_lookup_referrer(' kia1001 ');
