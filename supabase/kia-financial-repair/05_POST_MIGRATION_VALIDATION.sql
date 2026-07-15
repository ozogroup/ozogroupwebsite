-- ============================================================================
-- KIA Skin Care - Financial Repair - Step 5: Post-migration validation
-- Date: 2026-07-15
--
-- Read-only. Run this after 03 and 04 have both completed successfully.
-- Each query below states its expected result. If any query does not match
-- its expected result, stop and share the output before doing anything else
-- (do not re-run 03/04 repeatedly trying to "fix" it — investigate first).
-- ============================================================================

-- 1. Expected: 4 rows, all with is_security_definer = true.
SELECT p.proname AS function_name, p.prosecdef AS is_security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('kia_is_admin', 'kia_generate_booking_commissions', 'kia_approve_paid_membership', 'kia_set_commission_status')
ORDER BY p.proname;

-- 2. Expected: every row shows rls_enabled = true.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('partners', 'commissions', 'payouts', 'wallet_transactions', 'bookings', 'memberships', 'referral_tree', 'admins', 'commission_settings', 'system_settings')
ORDER BY c.relname;

-- 3. Expected: exactly one row, with the confirmed values
--    (0.15, 1000.00, 500.00).
SELECT payout_deduction_rate, payout_minimum_amount, membership_referral_bonus_amount
FROM public.system_settings
ORDER BY updated_at DESC NULLS LAST
LIMIT 1;

-- 4. Expected: zero rows (no duplicate commission groups exist).
SELECT source_type, source_id, partner_id, level, COUNT(*)
FROM public.commissions
WHERE deleted_at IS NULL
GROUP BY source_type, source_id, partner_id, level
HAVING COUNT(*) > 1;

-- 5. Expected: zero rows (no partner left in the legacy 'approved' status).
SELECT id, partner_code, status FROM public.partners WHERE status = 'approved'::public.partner_status;

-- 6. Expected: zero rows (every partner's cached wallet figures now match the ledger).
WITH ledger AS (
  SELECT partner_id,
         SUM(amount) FILTER (WHERE status IN ('approved', 'paid') AND NOT reversed) AS earned_total
  FROM public.commissions WHERE deleted_at IS NULL GROUP BY partner_id
),
payout_paid AS (
  SELECT partner_id,
         SUM(COALESCE(gross_amount, available_balance, amount, 0)) AS payout_gross_paid_total
  FROM public.payouts WHERE status = 'paid' GROUP BY partner_id
)
SELECT p.id, p.partner_code, p.wallet_balance,
       ROUND(COALESCE(l.earned_total, 0) - COALESCE(pp.payout_gross_paid_total, 0), 2) AS expected_wallet_balance
FROM public.partners p
LEFT JOIN ledger l ON l.partner_id = p.id
LEFT JOIN payout_paid pp ON pp.partner_id = p.id
WHERE ROUND(p.wallet_balance - GREATEST(0, ROUND(COALESCE(l.earned_total, 0) - COALESCE(pp.payout_gross_paid_total, 0), 2)), 2) <> 0;

-- 7. Expected: at least as many rows as memberships with an eligible sponsor
--    (each row is a flat Rs 500 pending commission, source_type='membership').
SELECT COUNT(*) AS membership_commission_count, SUM(amount) AS membership_commission_total
FROM public.commissions
WHERE source_type = 'membership'::public.source_type AND deleted_at IS NULL;

-- 8. Informational — ambiguous bookings still awaiting manual review.
SELECT COUNT(*) AS unresolved_ambiguous_bookings
FROM public._kia_financial_repair_20260715_ambiguous_bookings
WHERE resolved = false;

-- 9. Informational — full list of what step 4 corrected, for your records.
SELECT * FROM public._kia_financial_repair_20260715_status_corrections ORDER BY corrected_at DESC;
SELECT * FROM public._kia_financial_repair_20260715_wallet_corrections ORDER BY corrected_at DESC;

-- 10. End-to-end smoke test (manual, not run automatically):
--     a. Create two test partners A (sponsor) and B (A's direct referral), both active.
--     b. As admin, create+approve a paid membership for a third test person C with
--        referral_code = B's code, so B becomes C's sponsor... (or use A/B directly).
--     c. Confirm ONE new commissions row appears: source_type='membership',
--        partner_id = sponsor's id, level=1, amount=500.00, status='pending'.
--     d. Approve that commission (kia_set_commission_status or the admin UI) and
--        confirm the sponsor's wallet_balance increases by exactly 500.00 and a
--        wallet_transactions row is written.
--     e. Create a paid+confirmed test booking referred by B and confirm the
--        booking-commission levels/amounts still match the existing 6/3/1.7/1.2%
--        model with no regression.
