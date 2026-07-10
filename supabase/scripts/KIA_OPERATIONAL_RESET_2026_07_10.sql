-- ============================================================================
-- KIA Skin Care - Guarded Operational Fresh Start Reset
-- Date: 2026-07-10
-- ============================================================================
-- DESTRUCTIVE SCRIPT.
--
-- Run only after:
--   1. Supabase Dashboard backup is complete.
--   2. KIA_PRE_RESET_SNAPSHOT_2026_07_10.sql has been run.
--   3. The project reference and confirmation values below are edited.
--
-- This resets operational/test data only. It preserves schema, treatments,
-- content, FAQs, testimonials, contact settings, media, commission settings,
-- system settings, and admin/super-admin profiles.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  confirmed_project_ref text := 'clagbybuxaumyroknjai';
  reset_confirmation text := 'RESET_KIA_OPERATIONAL_DATA';
BEGIN
  IF confirmed_project_ref = 'REPLACE_WITH_SUPABASE_PROJECT_REF' THEN
    RAISE EXCEPTION 'Reset blocked: edit confirmed_project_ref before running';
  END IF;

  IF reset_confirmation <> 'RESET_KIA_OPERATIONAL_DATA' THEN
    RAISE EXCEPTION 'Reset blocked: reset_confirmation must equal RESET_KIA_OPERATIONAL_DATA';
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.kia_reset_row_counts_audit (
  run_label text NOT NULL,
  phase text NOT NULL,
  table_name text NOT NULL,
  row_count bigint NOT NULL,
  recorded_at timestamptz DEFAULT NOW()
);

DELETE FROM public.kia_reset_row_counts_audit
WHERE run_label = 'kia_operational_reset_20260710';

DO $$
DECLARE
  table_name text;
  row_count bigint;
  reset_tables text[] := ARRAY[
    'activity_logs',
    'notifications',
    'daily_partner_stats',
    'otp_logs',
    'webhook_logs',
    'payments',
    'shipping_orders',
    'wallet_transactions',
    'payouts',
    'commissions',
    'earnings',
    'partner_sales',
    'referral_tree',
    'referral_clicks',
    'referral_links',
    'bookings',
    'booking_slots',
    'memberships',
    'support_requests',
    'franchise_leads',
    'partner_kyc',
    'partners'
  ];
BEGIN
  FOREACH table_name IN ARRAY reset_tables
  LOOP
    IF to_regclass('public.' || quote_ident(table_name)) IS NOT NULL THEN
      EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
      INSERT INTO public.kia_reset_row_counts_audit (run_label, phase, table_name, row_count)
      VALUES ('kia_operational_reset_20260710', 'before', table_name, row_count);
    END IF;
  END LOOP;

  FOREACH table_name IN ARRAY reset_tables
  LOOP
    IF to_regclass('public.' || quote_ident(table_name)) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I', table_name);
    END IF;
  END LOOP;

  -- Remove non-admin app profiles after partner/member rows are gone.
  IF to_regclass('public.profiles') IS NOT NULL THEN
    SELECT COUNT(*)
    INTO row_count
    FROM public.profiles
    WHERE COALESCE(role::text, '') NOT IN ('super_admin', 'admin');

    INSERT INTO public.kia_reset_row_counts_audit (run_label, phase, table_name, row_count)
    VALUES ('kia_operational_reset_20260710', 'before', 'profiles_non_admin', row_count);

    DELETE FROM public.profiles
    WHERE COALESCE(role::text, '') NOT IN ('super_admin', 'admin');
  END IF;

  FOREACH table_name IN ARRAY reset_tables
  LOOP
    IF to_regclass('public.' || quote_ident(table_name)) IS NOT NULL THEN
      EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
      INSERT INTO public.kia_reset_row_counts_audit (run_label, phase, table_name, row_count)
      VALUES ('kia_operational_reset_20260710', 'after', table_name, row_count);
    END IF;
  END LOOP;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    SELECT COUNT(*)
    INTO row_count
    FROM public.profiles
    WHERE COALESCE(role::text, '') NOT IN ('super_admin', 'admin');

    INSERT INTO public.kia_reset_row_counts_audit (run_label, phase, table_name, row_count)
    VALUES ('kia_operational_reset_20260710', 'after', 'profiles_non_admin', row_count);
  END IF;
END$$;

-- Reset owned identity sequences where they exist. UUID primary keys are not affected.
DO $$
DECLARE
  seq record;
BEGIN
  FOR seq IN
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
      AND sequence_name ILIKE ANY (ARRAY[
        '%booking%',
        '%membership%',
        '%partner%',
        '%commission%',
        '%payout%',
        '%payment%',
        '%wallet%',
        '%referral%'
      ])
  LOOP
    EXECUTE format('ALTER SEQUENCE %I.%I RESTART WITH 1', seq.sequence_schema, seq.sequence_name);
  END LOOP;
END$$;

COMMIT;

SELECT phase, table_name, row_count, recorded_at
FROM public.kia_reset_row_counts_audit
WHERE run_label = 'kia_operational_reset_20260710'
ORDER BY table_name, phase;

-- AUTH USER NOTE:
-- Supabase auth.users is intentionally not touched by this SQL script.
-- Delete test Auth users only through server-side Supabase Admin API tooling
-- after confirming the same project reference.
