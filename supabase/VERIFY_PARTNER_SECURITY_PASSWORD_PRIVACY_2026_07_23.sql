-- Verification for partner password reset + downline privacy patch.
-- Run after MIGRATION_PARTNER_SECURITY_PASSWORD_PRIVACY_2026_07_23.sql.

SELECT
  'partner_password_reset_requests table exists' AS check_name,
  to_regclass('public.partner_password_reset_requests') IS NOT NULL AS ok;

SELECT
  'kia_get_partner_downline_safe exists' AS check_name,
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'kia_get_partner_downline_safe'
  ) AS ok;

SELECT
  'reset table RLS enabled' AS check_name,
  c.relrowsecurity AS ok
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'partner_password_reset_requests';

SELECT
  'reset table policy count' AS check_name,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'partner_password_reset_requests';

SELECT
  'safe downline function grants' AS check_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'kia_get_partner_downline_safe'
ORDER BY grantee, privilege_type;
