-- ============================================================================
-- Rollback for MIGRATION_PARTNER_SECURITY_PASSWORD_PRIVACY_2026_07_23.sql
-- Safe rollback: removes only objects created by the partner security patch.
-- Does not touch partners, memberships, bookings, commissions, payouts, KYC,
-- generated IDs, Auth users, or passwords.
-- ============================================================================

BEGIN;

REVOKE ALL ON FUNCTION public.kia_get_partner_downline_safe(uuid) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.kia_get_partner_downline_safe(uuid);

DROP POLICY IF EXISTS "partner_password_reset_requests_admin_write" ON public.partner_password_reset_requests;
DROP POLICY IF EXISTS "partner_password_reset_requests_no_public_read" ON public.partner_password_reset_requests;

DROP TABLE IF EXISTS public.partner_password_reset_requests;

COMMIT;
