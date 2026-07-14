-- KIA Skin Care - Rollback for Business Engine Commission Ledger Patch
-- Date: 2026-07-14
--
-- Scope:
--   Removes only the function and partial unique index introduced by
--   MIGRATION_BUSINESS_ENGINE_COMMISSION_LEDGER_2026_07_14.sql.
--
-- Note:
--   This rollback intentionally does not restore prior commission_settings
--   percentages because the previous values are environment data. Restore
--   those from a Supabase snapshot if the final 6/3/1.7/1.2 model is reverted.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'kia_generate_booking_commissions'
      AND pg_get_function_identity_arguments(p.oid) = 'booking_uuid uuid'
  ) THEN
    REVOKE ALL ON FUNCTION public.kia_generate_booking_commissions(uuid) FROM PUBLIC;
  END IF;
END$$;

DROP FUNCTION IF EXISTS public.kia_generate_booking_commissions(uuid);

DROP INDEX IF EXISTS public.commissions_one_active_booking_level_per_partner;

COMMIT;

-- Verification:
-- SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND proname = 'kia_generate_booking_commissions';
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'commissions_one_active_booking_level_per_partner';
