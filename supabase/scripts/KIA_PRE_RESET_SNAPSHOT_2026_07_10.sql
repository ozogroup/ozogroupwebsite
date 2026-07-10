-- ============================================================================
-- KIA Skin Care - Pre Reset Snapshot
-- Date: 2026-07-10
-- ============================================================================
-- PURPOSE:
--   Creates app-table snapshots before a fresh-start operational reset.
--
-- IMPORTANT:
--   This does not replace a Supabase Dashboard backup.
--   It does not snapshot auth.users or storage object binaries.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_profiles AS TABLE public.profiles WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_partners AS TABLE public.partners WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_memberships AS TABLE public.memberships WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_bookings AS TABLE public.bookings WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_commissions AS TABLE public.commissions WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_payouts AS TABLE public.payouts WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_wallet_transactions AS TABLE public.wallet_transactions WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_payments AS TABLE public.payments WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_referral_tree AS TABLE public.referral_tree WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_referral_links AS TABLE public.referral_links WITH DATA;
CREATE TABLE IF NOT EXISTS public._kia_reset_backup_20260710_referral_clicks AS TABLE public.referral_clicks WITH DATA;

DO $$
BEGIN
  IF to_regclass('public.partner_sales') IS NOT NULL
     AND to_regclass('public._kia_reset_backup_20260710_partner_sales') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_reset_backup_20260710_partner_sales AS TABLE public.partner_sales WITH DATA';
  END IF;

  IF to_regclass('public.partner_kyc') IS NOT NULL
     AND to_regclass('public._kia_reset_backup_20260710_partner_kyc') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_reset_backup_20260710_partner_kyc AS TABLE public.partner_kyc WITH DATA';
  END IF;

  IF to_regclass('public.franchise_leads') IS NOT NULL
     AND to_regclass('public._kia_reset_backup_20260710_franchise_leads') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_reset_backup_20260710_franchise_leads AS TABLE public.franchise_leads WITH DATA';
  END IF;
END$$;

COMMIT;

SELECT
  table_name,
  row_estimate
FROM (
  SELECT 'profiles' AS table_name, COUNT(*)::bigint AS row_estimate FROM public._kia_reset_backup_20260710_profiles
  UNION ALL SELECT 'partners', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_partners
  UNION ALL SELECT 'memberships', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_memberships
  UNION ALL SELECT 'bookings', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_bookings
  UNION ALL SELECT 'commissions', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_commissions
  UNION ALL SELECT 'payouts', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_payouts
  UNION ALL SELECT 'wallet_transactions', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_wallet_transactions
  UNION ALL SELECT 'payments', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_payments
  UNION ALL SELECT 'referral_tree', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_referral_tree
  UNION ALL SELECT 'referral_links', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_referral_links
  UNION ALL SELECT 'referral_clicks', COUNT(*)::bigint FROM public._kia_reset_backup_20260710_referral_clicks
) snapshot_counts
ORDER BY table_name;
