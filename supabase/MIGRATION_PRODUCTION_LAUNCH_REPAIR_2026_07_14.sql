-- ============================================================================
-- KIA Skin Care - Production Launch Repair
-- Date: 2026-07-14
-- Scope:
--   1. Non-recursive admin authorization for RLS.
--   2. Contact settings admin save support without broad RLS disabling.
--   3. Database-generated public business IDs.
--   4. Existing Kamran partner account repair without Auth password changes.
--   5. Support admin profile repair using the existing Auth user.
--
-- Safety:
--   * No production rows are deleted.
--   * No Auth users are created, deleted, or password-reset here.
--   * Existing valid IDs are preserved.
--   * RLS remains enabled on sensitive tables.
--   * Run only after reviewing the matching rollback file.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Snapshot tables. Created once and never overwritten.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public._kia_launch_backup_20260714_profiles') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_profiles AS TABLE public.profiles WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_partners') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_partners AS TABLE public.partners WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_memberships') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_memberships AS TABLE public.memberships WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_bookings') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_bookings AS TABLE public.bookings WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_contact_settings') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_contact_settings AS TABLE public.contact_settings WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_payments') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_payments AS TABLE public.payments WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_payouts') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_payouts AS TABLE public.payouts WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_commissions') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_commissions AS TABLE public.commissions WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_referral_tree') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_referral_tree AS TABLE public.referral_tree WITH DATA';
  END IF;
  IF to_regclass('public._kia_launch_backup_20260714_referral_links') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_referral_links AS TABLE public.referral_links WITH DATA';
  END IF;
  IF to_regclass('public.partner_sales') IS NOT NULL
     AND to_regclass('public._kia_launch_backup_20260714_partner_sales') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_launch_backup_20260714_partner_sales AS TABLE public.partner_sales WITH DATA';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 1. Non-recursive admin helper.
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
        AND p.role IN ('admin'::public.user_role, 'super_admin'::public.user_role)
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
-- 2. Repair support admin app profile using the existing Auth user.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  support_user_id uuid;
BEGIN
  SELECT id INTO support_user_id
  FROM auth.users
  WHERE lower(email) = 'supportkiaskincare@gmail.com'
  ORDER BY created_at
  LIMIT 1;

  IF support_user_id IS NULL THEN
    RAISE EXCEPTION 'Required admin Auth user supportkiaskincare@gmail.com was not found';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    support_user_id,
    'supportkiaskincare@gmail.com',
    'KIA Skin Care Admin',
    'admin'::public.user_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    role = 'admin'::public.user_role,
    email_verified = true,
    updated_at = now();

  IF to_regclass('public.admins') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'admins'
        AND column_name = 'id'
    ) THEN
      INSERT INTO public.admins (id, department, permissions, is_active, created_at)
      VALUES (
        support_user_id,
        'Administration',
        '{"all": true}'::jsonb,
        true,
        now()
      )
      ON CONFLICT (id) DO UPDATE
      SET
        department = COALESCE(public.admins.department, EXCLUDED.department),
        permissions = EXCLUDED.permissions,
        is_active = true;
    END IF;
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 3. Remove recursive profiles policies and replace them with helper policies.
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

-- ----------------------------------------------------------------------------
-- 4. Contact settings RLS. Public can read; admins can mutate.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. Business ID columns.
-- ----------------------------------------------------------------------------
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS membership_id text;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_id text,
  ADD COLUMN IF NOT EXISTS treatment_order_id text;

ALTER TABLE public.referral_tree
  ADD COLUMN IF NOT EXISTS referral_transaction_id text;

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS referral_transaction_id text;

ALTER TABLE public.partners
  ALTER COLUMN partner_code DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. Sequences start above existing live IDs.
-- Live baseline before this file was prepared:
--   partner max KIA/OZO number = 1003, next = 1004
--   membership/booking/treatment-order/referral IDs absent, next = 100001
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.kia_partner_code_seq START WITH 1004;
CREATE SEQUENCE IF NOT EXISTS public.kia_membership_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS public.kia_booking_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS public.kia_treatment_order_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS public.kia_referral_transaction_id_seq START WITH 100001;

SELECT setval(
  'public.kia_partner_code_seq',
  GREATEST(
    1003,
    COALESCE((
      SELECT MAX((regexp_match(upper(partner_code), '^(?:KIA|OZO)([0-9]+)$'))[1]::bigint)
      FROM public.partners
      WHERE partner_code ~* '^(KIA|OZO)[0-9]+$'
    ), 1003)
  ),
  true
);

SELECT setval('public.kia_membership_id_seq', 100000, true)
WHERE NOT EXISTS (
  SELECT 1 FROM public.memberships WHERE membership_id ~ '^KIAM[0-9]+$'
);

SELECT setval('public.kia_booking_id_seq', 100000, true)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bookings WHERE booking_id ~ '^KIAB[0-9]+$'
);

SELECT setval('public.kia_treatment_order_id_seq', 100000, true)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bookings WHERE treatment_order_id ~ '^KIAT[0-9]+$'
);

SELECT setval('public.kia_referral_transaction_id_seq', 100000, true)
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_tree WHERE referral_transaction_id ~ '^KIAR[0-9]+$'
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
-- 7. Triggers assign IDs inside the database.
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
-- 8. Backfill missing IDs without overwriting valid IDs.
-- ----------------------------------------------------------------------------
UPDATE public.memberships
SET membership_id = public.kia_next_membership_id()
WHERE membership_id IS NULL OR btrim(membership_id) = '';

UPDATE public.bookings
SET booking_id = public.kia_next_booking_id()
WHERE booking_id IS NULL OR btrim(booking_id) = '';

UPDATE public.bookings
SET treatment_order_id = public.kia_next_treatment_order_id()
WHERE treatment_order_id IS NULL OR btrim(treatment_order_id) = '';

UPDATE public.referral_tree
SET referral_transaction_id = public.kia_next_referral_transaction_id()
WHERE referral_transaction_id IS NULL OR btrim(referral_transaction_id) = '';

UPDATE public.commissions
SET referral_transaction_id = public.kia_next_referral_transaction_id()
WHERE referral_transaction_id IS NULL OR btrim(referral_transaction_id) = '';

SELECT setval(
  'public.kia_membership_id_seq',
  GREATEST(
    100000,
    COALESCE((SELECT MAX(substring(membership_id FROM 5)::bigint) FROM public.memberships WHERE membership_id ~ '^KIAM[0-9]+$'), 100000)
  ),
  true
);

SELECT setval(
  'public.kia_booking_id_seq',
  GREATEST(
    100000,
    COALESCE((SELECT MAX(substring(booking_id FROM 5)::bigint) FROM public.bookings WHERE booking_id ~ '^KIAB[0-9]+$'), 100000)
  ),
  true
);

SELECT setval(
  'public.kia_treatment_order_id_seq',
  GREATEST(
    100000,
    COALESCE((SELECT MAX(substring(treatment_order_id FROM 5)::bigint) FROM public.bookings WHERE treatment_order_id ~ '^KIAT[0-9]+$'), 100000)
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

-- ----------------------------------------------------------------------------
-- 9. Constraints and indexes.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_memberships_membership_id
  ON public.memberships(membership_id)
  WHERE membership_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_booking_id
  ON public.bookings(booking_id)
  WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_treatment_order_id
  ON public.bookings(treatment_order_id)
  WHERE treatment_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_tree_transaction_id
  ON public.referral_tree(referral_transaction_id)
  WHERE referral_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_commissions_referral_transaction_id
  ON public.commissions(referral_transaction_id)
  WHERE referral_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_partner_code_live
  ON public.partners(upper(partner_code))
  WHERE partner_code IS NOT NULL AND COALESCE(is_active, true) = true;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles(lower(email));

CREATE INDEX IF NOT EXISTS idx_profiles_phone_digits
  ON public.profiles(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'));

CREATE INDEX IF NOT EXISTS idx_memberships_email_lower
  ON public.memberships(lower(email));

CREATE INDEX IF NOT EXISTS idx_memberships_mobile_digits
  ON public.memberships(regexp_replace(COALESCE(mobile, ''), '\D', '', 'g'));

CREATE INDEX IF NOT EXISTS idx_memberships_membership_id
  ON public.memberships(membership_id);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_id
  ON public.bookings(booking_id);

CREATE INDEX IF NOT EXISTS idx_bookings_treatment_order_id
  ON public.bookings(treatment_order_id);

CREATE INDEX IF NOT EXISTS idx_partners_partner_code_upper
  ON public.partners(upper(partner_code));

CREATE INDEX IF NOT EXISTS idx_partners_status
  ON public.partners(status);

CREATE INDEX IF NOT EXISTS idx_memberships_status_payment
  ON public.memberships(membership_status, payment_status);

CREATE INDEX IF NOT EXISTS idx_bookings_status_payment
  ON public.bookings(booking_status, payment_status);

-- ----------------------------------------------------------------------------
-- 10. Referral lookup RPC. Returns only safe display fields.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_lookup_referrer(raw_code text)
RETURNS TABLE(valid boolean, partner_name text, partner_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    true AS valid,
    COALESCE(NULLIF(pf.full_name, ''), 'KIA Partner') AS partner_name,
    p.partner_code
  FROM public.partners p
  LEFT JOIN public.profiles pf ON pf.id = p.id
  WHERE upper(p.partner_code) = upper(btrim(raw_code))
    AND p.status = 'active'::public.partner_status
    AND COALESCE(p.is_active, true) = true
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.kia_lookup_referrer(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_lookup_referrer(text) TO anon;
GRANT EXECUTE ON FUNCTION public.kia_lookup_referrer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_lookup_referrer(text) TO service_role;

-- ----------------------------------------------------------------------------
-- 11. Exact Kamran account repair. Existing Auth user and password are preserved.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  kamran_user_id uuid;
  start_at timestamptz := now();
  expires_at timestamptz := now() + interval '1 year';
BEGIN
  SELECT id INTO kamran_user_id
  FROM auth.users
  WHERE lower(email) = 'kamranfakir@gmail.com'
  ORDER BY created_at
  LIMIT 1;

  IF kamran_user_id IS NULL THEN
    RAISE EXCEPTION 'Kamran Auth user kamranfakir@gmail.com was not found';
  END IF;

  UPDATE public.profiles
  SET
    role = 'partner'::public.user_role,
    membership_status = 'active',
    partner_code = COALESCE(NULLIF(partner_code, ''), 'KIA1001'),
    updated_at = now()
  WHERE id = kamran_user_id;

  UPDATE public.partners
  SET
    partner_code = 'KIA1001',
    status = 'active'::public.partner_status,
    is_active = true,
    referral_link = 'https://www.kiaskincare.com/KIA1001',
    membership_purchased_at = COALESCE(membership_purchased_at, start_at),
    membership_started_at = COALESCE(membership_started_at, start_at),
    membership_expires_at = COALESCE(membership_expires_at, expires_at),
    updated_at = now()
  WHERE id = kamran_user_id;

  UPDATE public.memberships
  SET
    partner_id = kamran_user_id,
    payment_status = 'paid'::public.payment_status,
    membership_status = 'active'::public.membership_status,
    updated_at = now()
  WHERE lower(email) = 'kamranfakir@gmail.com'
     OR partner_id = kamran_user_id;
END$$;

COMMIT;

-- ============================================================================
-- Verification queries to run after commit:
--
-- SELECT id, email, role, partner_code, membership_status
-- FROM public.profiles
-- WHERE lower(email) IN ('supportkiaskincare@gmail.com', 'kamranfakir@gmail.com');
--
-- SELECT p.id, p.partner_code, p.status, p.membership_started_at, p.membership_expires_at
-- FROM public.partners p
-- JOIN public.profiles pr ON pr.id = p.id
-- WHERE lower(pr.email) = 'kamranfakir@gmail.com';
--
-- SELECT id, membership_id, email, payment_status, membership_status
-- FROM public.memberships
-- ORDER BY created_at DESC;
--
-- SELECT id, booking_id, treatment_order_id
-- FROM public.bookings
-- ORDER BY created_at DESC
-- LIMIT 20;
-- ============================================================================
