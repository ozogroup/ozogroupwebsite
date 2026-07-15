-- ============================================================================
-- KIA Skin Care - Financial Repair - Step 1: READ-ONLY diagnostics
-- Date: 2026-07-15
--
-- This file runs ONLY SELECT statements. It changes nothing. Run it first and
-- read the output before running any other file in this folder.
--
-- Purpose: find out what is ACTUALLY true in the live database right now,
-- because several historical migration files in supabase/ were written but
-- may never have been applied, and one file (FIX_RLS_RECURSION.sql) disables
-- Row-Level Security on every financial table with nothing later confirmed to
-- re-enable it. See docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md section 3 (B1) for
-- why this matters.
--
-- How to run: open Supabase Dashboard -> SQL Editor -> paste this whole file
-- -> Run. Read every result block. Nothing here can break anything.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Is Row-Level Security actually ON for every financial/identity table?
--    Expected (safe) result: relrowsecurity = true for every row below.
--    If ANY row shows false, that table is currently unprotected by the
--    database and relies entirely on application code — treat as urgent.
-- ----------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'profiles', 'admins', 'partners', 'commissions', 'payouts',
    'wallet_transactions', 'bookings', 'memberships', 'referral_tree',
    'commission_settings', 'system_settings'
  )
ORDER BY c.relname;

-- ----------------------------------------------------------------------------
-- 2. Which policies currently exist on those tables (if RLS is on, these are
--    the rules actually enforced; if a table has zero rows here, RLS with no
--    policy means nobody without the service-role key can read/write it).
-- ----------------------------------------------------------------------------
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'admins', 'partners', 'commissions', 'payouts',
    'wallet_transactions', 'bookings', 'memberships', 'referral_tree'
  )
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- 3. Which of the required functions already exist, and their exact
--    signature/security mode? Expected (healthy) result: all of these present
--    with prosecdef = true (SECURITY DEFINER).
-- ----------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'kia_is_admin', 'kia_lookup_referrer', 'kia_approve_paid_membership',
    'kia_generate_booking_commissions', 'process_partner_payout',
    'kia_next_partner_code', 'kia_next_membership_id', 'kia_next_booking_id',
    'kia_next_treatment_order_id', 'kia_next_referral_transaction_id'
  )
ORDER BY p.proname;

-- ----------------------------------------------------------------------------
-- 4. Which unique indexes/constraints currently protect commissions against
--    duplicate rows for the same (source_type, source_id, partner_id, level)?
--    Expected: at least one row. If this returns ZERO rows, duplicate
--    commissions are currently possible under concurrent requests.
-- ----------------------------------------------------------------------------
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
WHERE c.relname = 'commissions' AND con.contype = 'u'
UNION ALL
SELECT indexname, 'partial-unique-index', indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'commissions' AND indexdef ILIKE '%UNIQUE%';

-- ----------------------------------------------------------------------------
-- 5. Do any duplicate commission rows already exist? (Would block creating a
--    new unique index later, and would mean a partner may have been double
--    paid.) Expected (safe) result: zero rows.
-- ----------------------------------------------------------------------------
SELECT source_type, source_id, partner_id, level, COUNT(*) AS row_count,
       array_agg(id) AS commission_ids, array_agg(status) AS statuses,
       SUM(amount) AS total_amount
FROM public.commissions
WHERE deleted_at IS NULL
GROUP BY source_type, source_id, partner_id, level
HAVING COUNT(*) > 1
ORDER BY total_amount DESC;

-- ----------------------------------------------------------------------------
-- 6. Which columns referenced by the repair already exist? (Prevents guessing
--    whether Phase 2 needs to add them.)
-- ----------------------------------------------------------------------------
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'system_settings' AND column_name IN
      ('payout_deduction_rate', 'payout_minimum_amount', 'membership_referral_bonus_amount',
       'payout_kyc_required', 'payout_bank_required', 'payout_single_open_request_only'))
    OR (table_name = 'bookings' AND column_name IN
      ('commission_source_partner_id', 'net_amount', 'discount_snapshot'))
    OR (table_name = 'payouts' AND column_name IN
      ('gross_amount', 'deduction_rate', 'deduction_amount', 'net_amount'))
  )
ORDER BY table_name, column_name;

-- ----------------------------------------------------------------------------
-- 7. Partner status breakdown — how many partners sit in each status,
--    specifically how many are stuck at the legacy 'approved' value that no
--    application code currently treats as eligible for anything.
-- ----------------------------------------------------------------------------
SELECT status, COUNT(*) AS partner_count
FROM public.partners
GROUP BY status
ORDER BY status;

-- ----------------------------------------------------------------------------
-- 8. Wallet vs. ledger reconciliation preview. For every partner, compares
--    the cached partners.wallet_balance/total_earnings/paid_earnings against
--    what the commissions+payouts ledger implies they should be. This is the
--    exact query the reconciliation step (04) will act on — run it here
--    first, read-only, so you can see the size of any mismatch before
--    anything is corrected.
-- ----------------------------------------------------------------------------
WITH ledger AS (
  SELECT
    partner_id,
    SUM(amount) FILTER (WHERE status IN ('approved', 'paid') AND NOT reversed) AS earned_total,
    SUM(amount) FILTER (WHERE status = 'paid' AND NOT reversed) AS paid_total
  FROM public.commissions
  WHERE deleted_at IS NULL
  GROUP BY partner_id
),
payout_paid AS (
  SELECT partner_id, SUM(COALESCE(net_amount, amount, 0)) AS payout_paid_total
  FROM public.payouts
  WHERE status = 'paid'
  GROUP BY partner_id
)
SELECT
  p.id AS partner_id,
  p.partner_code,
  p.status,
  p.wallet_balance AS cached_wallet_balance,
  p.total_earnings AS cached_total_earnings,
  p.paid_earnings AS cached_paid_earnings,
  COALESCE(l.earned_total, 0) AS ledger_total_earned,
  COALESCE(l.paid_total, 0) AS ledger_commissions_marked_paid,
  COALESCE(pp.payout_paid_total, 0) AS ledger_payouts_paid,
  ROUND(COALESCE(l.earned_total, 0) - COALESCE(pp.payout_paid_total, 0), 2) AS ledger_expected_wallet_balance,
  ROUND(
    p.wallet_balance - (COALESCE(l.earned_total, 0) - COALESCE(pp.payout_paid_total, 0)),
    2
  ) AS wallet_mismatch
FROM public.partners p
LEFT JOIN ledger l ON l.partner_id = p.id
LEFT JOIN payout_paid pp ON pp.partner_id = p.id
WHERE ROUND(
    p.wallet_balance - (COALESCE(l.earned_total, 0) - COALESCE(pp.payout_paid_total, 0)),
    2
  ) <> 0
  OR ROUND(p.total_earnings - COALESCE(l.earned_total, 0), 2) <> 0
ORDER BY ABS(p.wallet_balance - (COALESCE(l.earned_total, 0) - COALESCE(pp.payout_paid_total, 0))) DESC;

-- ----------------------------------------------------------------------------
-- 9. Bookings with ambiguous/missing referral attribution (paid + confirmed
--    or completed, but no referred_by and no resolvable referral/partner
--    code). These will never generate commissions under any implementation
--    and are listed here for manual review, not auto-fixed.
-- ----------------------------------------------------------------------------
SELECT id, booking_id, customer_name, payment_status, booking_status,
       referred_by, referral_code, partner_code, payment_amount, created_at
FROM public.bookings
WHERE deleted_at IS NULL
  AND payment_status::text = 'paid'
  AND booking_status::text IN ('confirmed', 'completed')
  AND referred_by IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.partners pt
    WHERE upper(pt.partner_code) = upper(COALESCE(public.bookings.referral_code, public.bookings.partner_code, ''))
      AND pt.status = 'active'::public.partner_status
  )
ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------
-- 10. Membership rows that are approved/active but have a sponsor who was
--     never paid the (new) flat membership commission — useful after Phase 2
--     ships, to see the backlog Phase 3's backfill would need to cover.
-- ----------------------------------------------------------------------------
SELECT m.id, m.membership_id, m.full_name, m.sponsor_id, m.membership_status,
       m.amount, m.created_at
FROM public.memberships m
WHERE m.membership_status::text IN ('active', 'approved')
  AND m.sponsor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.commissions c
    WHERE c.source_type = 'membership'::public.source_type
      AND c.source_id = m.id
      AND c.partner_id = m.sponsor_id
      AND c.deleted_at IS NULL
  )
ORDER BY m.created_at DESC;
