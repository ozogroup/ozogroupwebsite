-- ============================================================================
-- KIA Skin Care - Financial Repair - Step 2: Pre-migration backup snapshots
-- Date: 2026-07-15
--
-- Creates full-copy snapshot tables of every financial table BEFORE step 3/4
-- change anything. Every snapshot table name is timestamped and created with
-- CREATE TABLE IF NOT EXISTS ... AS SELECT — safe to run this file more than
-- once, it will never overwrite a snapshot that already exists.
--
-- Nothing in this file touches an original table. This only adds new backup
-- tables. Run this AFTER you have read the output of step 1 and are ready to
-- proceed, and BEFORE step 3.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_partners') THEN
    CREATE TABLE public._kia_financial_repair_20260715_partners AS SELECT * FROM public.partners;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_partners';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_partners';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_commissions') THEN
    CREATE TABLE public._kia_financial_repair_20260715_commissions AS SELECT * FROM public.commissions;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_commissions';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_commissions';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_payouts') THEN
    CREATE TABLE public._kia_financial_repair_20260715_payouts AS SELECT * FROM public.payouts;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_payouts';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_payouts';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_memberships') THEN
    CREATE TABLE public._kia_financial_repair_20260715_memberships AS SELECT * FROM public.memberships;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_memberships';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_memberships';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_bookings') THEN
    CREATE TABLE public._kia_financial_repair_20260715_bookings AS SELECT * FROM public.bookings;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_bookings';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_bookings';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_wallet_transactions') THEN
    CREATE TABLE public._kia_financial_repair_20260715_wallet_transactions AS SELECT * FROM public.wallet_transactions;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_wallet_transactions';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_wallet_transactions';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_referral_tree') THEN
    CREATE TABLE public._kia_financial_repair_20260715_referral_tree AS SELECT * FROM public.referral_tree;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_referral_tree';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_referral_tree';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_commission_settings') THEN
    CREATE TABLE public._kia_financial_repair_20260715_commission_settings AS SELECT * FROM public.commission_settings;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_commission_settings';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_commission_settings';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_kia_financial_repair_20260715_system_settings') THEN
    CREATE TABLE public._kia_financial_repair_20260715_system_settings AS SELECT * FROM public.system_settings;
    RAISE NOTICE 'Snapshot created: _kia_financial_repair_20260715_system_settings';
  ELSE
    RAISE NOTICE 'Snapshot already exists, skipped: _kia_financial_repair_20260715_system_settings';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- Verification: row counts of every snapshot vs. its live source table.
-- Expected result: each snapshot row_count matches what the live table had
-- at the moment you ran this file (they will start to diverge from the live
-- table after step 3/4 run — that is expected and correct, the snapshot is
-- meant to freeze the "before" state).
-- ----------------------------------------------------------------------------
SELECT 'partners' AS table_name, (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_partners) AS snapshot_rows, (SELECT COUNT(*) FROM public.partners) AS live_rows
UNION ALL
SELECT 'commissions', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_commissions), (SELECT COUNT(*) FROM public.commissions)
UNION ALL
SELECT 'payouts', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_payouts), (SELECT COUNT(*) FROM public.payouts)
UNION ALL
SELECT 'memberships', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_memberships), (SELECT COUNT(*) FROM public.memberships)
UNION ALL
SELECT 'bookings', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_bookings), (SELECT COUNT(*) FROM public.bookings)
UNION ALL
SELECT 'wallet_transactions', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_wallet_transactions), (SELECT COUNT(*) FROM public.wallet_transactions)
UNION ALL
SELECT 'referral_tree', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_referral_tree), (SELECT COUNT(*) FROM public.referral_tree)
UNION ALL
SELECT 'commission_settings', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_commission_settings), (SELECT COUNT(*) FROM public.commission_settings)
UNION ALL
SELECT 'system_settings', (SELECT COUNT(*) FROM public._kia_financial_repair_20260715_system_settings), (SELECT COUNT(*) FROM public.system_settings);
