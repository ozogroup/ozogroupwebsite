-- ============================================================================
-- KIA Skin Care - Financial Repair - Step 4: Reconciliation and safe backfill
-- Date: 2026-07-15
--
-- This is the ONLY file in this package that changes existing data values.
-- Run 02_PRE_MIGRATION_BACKUP_SNAPSHOTS.sql before this file — every value
-- this file overwrites has a full "before" copy sitting in a
-- _kia_financial_repair_20260715_* snapshot table already, and every
-- individual correction this file makes is also logged into a new exception
-- table below so you can see exactly what changed and why.
--
-- Implements the three decisions confirmed by the project owner on
-- 2026-07-15 (docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md section 1):
--   1. Bulk-normalize partner status 'approved' -> 'active'.
--   2. Auto-correct wallet_balance/total_earnings/paid_earnings to match the
--      commissions+payouts ledger wherever they disagree.
--   3. Backfill the new flat membership commission for already-approved
--      memberships that predate this repair (so existing sponsors are not
--      left permanently unpaid for members who joined before today).
--
-- Ambiguous bookings (paid+confirmed/completed with no resolvable referrer)
-- are NOT touched — they are only listed, per the explicit instruction to
-- record ambiguous rows for manual review instead of guessing.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Exception/audit tables for this run. Idempotent — created once, reused
--    on every re-run so a repeated run doesn't lose the history of what it
--    already corrected.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._kia_financial_repair_20260715_wallet_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  partner_code TEXT,
  wallet_balance_before NUMERIC(15,2),
  wallet_balance_after NUMERIC(15,2),
  total_earnings_before NUMERIC(15,2),
  total_earnings_after NUMERIC(15,2),
  paid_earnings_before NUMERIC(15,2),
  paid_earnings_after NUMERIC(15,2),
  corrected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public._kia_financial_repair_20260715_status_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  partner_code TEXT,
  status_before TEXT,
  status_after TEXT,
  corrected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public._kia_financial_repair_20260715_ambiguous_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  booking_display_id TEXT,
  customer_name TEXT,
  payment_amount NUMERIC(15,2),
  referral_code TEXT,
  partner_code TEXT,
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_note TEXT
);

-- ----------------------------------------------------------------------------
-- 1. Partner status normalization: 'approved' -> 'active'.
--    Confirmed decision: automatic. The existing trigger
--    trg_kia_assign_partner_code_on_activation fires on this UPDATE and will
--    assign a partner_code to any of these rows that doesn't already have
--    one, exactly as it does for any other transition into 'active'.
-- ----------------------------------------------------------------------------
INSERT INTO public._kia_financial_repair_20260715_status_corrections
  (partner_id, partner_code, status_before, status_after)
SELECT id, partner_code, status::text, 'active'
FROM public.partners
WHERE status = 'approved'::public.partner_status;

UPDATE public.partners
SET status = 'active'::public.partner_status, updated_at = now()
WHERE status = 'approved'::public.partner_status;

-- ----------------------------------------------------------------------------
-- 2. Wallet-to-ledger reconciliation.
--    Confirmed decision: auto-correct. Recomputes wallet_balance and
--    total_earnings/paid_earnings directly from the commissions+payouts
--    ledger (the canonical source of truth per the locked business rules)
--    and overwrites the cached columns wherever they disagree, logging every
--    correction with its before/after values first.
-- ----------------------------------------------------------------------------
WITH ledger AS (
  SELECT
    partner_id,
    SUM(amount) FILTER (WHERE status IN ('approved', 'paid') AND NOT reversed) AS earned_total,
    SUM(amount) FILTER (WHERE status = 'paid' AND NOT reversed) AS commissions_paid_total
  FROM public.commissions
  WHERE deleted_at IS NULL
  GROUP BY partner_id
),
payout_paid AS (
  SELECT partner_id, SUM(COALESCE(net_amount, amount, 0)) AS payout_paid_total,
         SUM(COALESCE(gross_amount, available_balance, amount, 0)) AS payout_gross_paid_total
  FROM public.payouts
  WHERE status = 'paid'
  GROUP BY partner_id
),
target AS (
  SELECT
    p.id AS partner_id,
    p.partner_code,
    p.wallet_balance AS wallet_before,
    p.total_earnings AS earnings_before,
    p.paid_earnings AS paid_before,
    ROUND(COALESCE(l.earned_total, 0) - COALESCE(pp.payout_gross_paid_total, 0), 2) AS wallet_target,
    ROUND(COALESCE(l.earned_total, 0), 2) AS earnings_target,
    ROUND(COALESCE(pp.payout_paid_total, 0), 2) AS paid_target
  FROM public.partners p
  LEFT JOIN ledger l ON l.partner_id = p.id
  LEFT JOIN payout_paid pp ON pp.partner_id = p.id
)
INSERT INTO public._kia_financial_repair_20260715_wallet_corrections
  (partner_id, partner_code, wallet_balance_before, wallet_balance_after,
   total_earnings_before, total_earnings_after, paid_earnings_before, paid_earnings_after)
SELECT partner_id, partner_code, wallet_before, GREATEST(0, wallet_target),
       earnings_before, earnings_target, paid_before, paid_target
FROM target
WHERE ROUND(wallet_before - wallet_target, 2) <> 0
   OR ROUND(earnings_before - earnings_target, 2) <> 0
   OR ROUND(paid_before - paid_target, 2) <> 0;

WITH ledger AS (
  SELECT
    partner_id,
    SUM(amount) FILTER (WHERE status IN ('approved', 'paid') AND NOT reversed) AS earned_total
  FROM public.commissions
  WHERE deleted_at IS NULL
  GROUP BY partner_id
),
payout_paid AS (
  SELECT partner_id,
         SUM(COALESCE(net_amount, amount, 0)) AS payout_paid_total,
         SUM(COALESCE(gross_amount, available_balance, amount, 0)) AS payout_gross_paid_total
  FROM public.payouts
  WHERE status = 'paid'
  GROUP BY partner_id
),
target AS (
  SELECT
    p.id AS partner_id,
    GREATEST(0, ROUND(COALESCE(l.earned_total, 0) - COALESCE(pp.payout_gross_paid_total, 0), 2)) AS wallet_target,
    ROUND(COALESCE(l.earned_total, 0), 2) AS earnings_target,
    ROUND(COALESCE(pp.payout_paid_total, 0), 2) AS paid_target
  FROM public.partners p
  LEFT JOIN ledger l ON l.partner_id = p.id
  LEFT JOIN payout_paid pp ON pp.partner_id = p.id
)
UPDATE public.partners p
SET
  wallet_balance = t.wallet_target,
  total_earnings = t.earnings_target,
  paid_earnings = t.paid_target,
  updated_at = now()
FROM target t
WHERE p.id = t.partner_id
  AND (
    ROUND(p.wallet_balance - t.wallet_target, 2) <> 0
    OR ROUND(p.total_earnings - t.earnings_target, 2) <> 0
    OR ROUND(p.paid_earnings - t.paid_target, 2) <> 0
  );

-- ----------------------------------------------------------------------------
-- 3. Membership commission backfill for pre-existing active/approved
--    memberships that predate this repair, so their sponsor isn't
--    permanently skipped just because they joined before the flat-bonus
--    feature existed. Uses the same eligibility rule and idempotent
--    ON CONFLICT as the RPC in step 3 of this package.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  bonus_amount numeric;
BEGIN
  SELECT COALESCE(membership_referral_bonus_amount, 500) INTO bonus_amount
  FROM public.system_settings ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  bonus_amount := COALESCE(bonus_amount, 500);

  IF bonus_amount > 0 THEN
    INSERT INTO public.commissions (
      partner_id, source_type, source_id, source_amount, level, percentage, amount,
      status, reversed, is_active, created_at, updated_at
    )
    SELECT
      m.sponsor_id, 'membership'::public.source_type, m.id, COALESCE(m.amount, 0), 1, 0, bonus_amount,
      'pending'::public.commission_status, false, true, now(), now()
    FROM public.memberships m
    JOIN public.partners sp ON sp.id = m.sponsor_id
    WHERE m.membership_status::text IN ('active', 'approved')
      AND m.sponsor_id IS NOT NULL
      AND sp.status = 'active'::public.partner_status
      AND COALESCE(sp.is_active, true) = true
      AND sp.deleted_at IS NULL
      AND (sp.membership_expires_at IS NULL OR sp.membership_expires_at >= now())
      AND NOT EXISTS (
        SELECT 1 FROM public.commissions c
        WHERE c.source_type = 'membership'::public.source_type
          AND c.source_id = m.id
          AND c.partner_id = m.sponsor_id
          AND c.deleted_at IS NULL
      )
    ON CONFLICT (source_type, source_id, partner_id, level)
      WHERE deleted_at IS NULL
      DO NOTHING;
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 4. Ambiguous bookings — flagged only, never auto-changed. Lists paid +
--    confirmed/completed bookings with no resolvable referrer, for the
--    admin to review manually (e.g. via Admin > Bookings) and either assign
--    a correct partner code or leave uncommissioned intentionally.
-- ----------------------------------------------------------------------------
INSERT INTO public._kia_financial_repair_20260715_ambiguous_bookings
  (booking_id, booking_display_id, customer_name, payment_amount, referral_code, partner_code)
SELECT b.id, b.booking_id, b.customer_name, b.payment_amount, b.referral_code, b.partner_code
FROM public.bookings b
WHERE b.deleted_at IS NULL
  AND b.payment_status::text = 'paid'
  AND b.booking_status::text IN ('confirmed', 'completed')
  AND b.referred_by IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.partners pt
    WHERE upper(pt.partner_code) = upper(COALESCE(b.referral_code, b.partner_code, ''))
      AND pt.status = 'active'::public.partner_status
  )
  AND NOT EXISTS (
    SELECT 1 FROM public._kia_financial_repair_20260715_ambiguous_bookings existing
    WHERE existing.booking_id = b.id
  );

COMMIT;

-- ============================================================================
-- What to check after this file runs
-- ============================================================================
-- SELECT * FROM public._kia_financial_repair_20260715_status_corrections ORDER BY corrected_at DESC;
-- SELECT * FROM public._kia_financial_repair_20260715_wallet_corrections ORDER BY corrected_at DESC;
-- SELECT * FROM public._kia_financial_repair_20260715_ambiguous_bookings WHERE resolved = false;
-- SELECT COUNT(*) FROM public.commissions WHERE source_type = 'membership'; -- should now be > 0 if any sponsors existed
