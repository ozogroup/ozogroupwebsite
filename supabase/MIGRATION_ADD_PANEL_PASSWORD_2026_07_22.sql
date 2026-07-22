-- ============================================================================
-- MIGRATION: Add panel_password column to partners table — 2026-07-22
-- ============================================================================
-- Stores the partner's login password in plaintext so admin can see it
-- in the membership requests and referral network pages.
--
-- Safety: ALTER TABLE ADD COLUMN only. No data modifications.
-- ============================================================================

ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS panel_password text DEFAULT NULL;

COMMENT ON COLUMN public.partners.panel_password IS 'Plaintext login password visible to admin for partner support';

SELECT 'migration_add_panel_password_2026_07_22_ready' AS status;
