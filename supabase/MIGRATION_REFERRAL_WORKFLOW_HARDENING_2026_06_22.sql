-- ============================================================================
-- KIA Skin Care - Referral Workflow Hardening Migration
-- Date: 2026-06-22
-- ============================================================================
-- Actual commissions schema uses source_type + source_id. There is no
-- commissions.booking_id column. This migration is additive and idempotent:
-- no DROP, TRUNCATE, DELETE, or data reset statements are used.
--
-- Run after: MIGRATION_PRODUCTION_HARDENING_2026_06_22.sql
-- ============================================================================

-- Fail with a useful diagnostic instead of attempting to alter duplicate data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.commissions
    WHERE deleted_at IS NULL
    GROUP BY source_type, source_id, partner_id, level
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate active commission identities exist. Review the manual duplicate query before creating uq_commissions_source_partner_level.';
  END IF;
END $$;

-- One live commission per source, partner, and referral level.
CREATE UNIQUE INDEX IF NOT EXISTS uq_commissions_source_partner_level
  ON public.commissions(source_type, source_id, partner_id, level)
  WHERE deleted_at IS NULL;

-- Dashboard, partner income, and payout allocation access paths.
CREATE INDEX IF NOT EXISTS idx_commissions_status_created
  ON public.commissions(status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_partner_status_created
  ON public.commissions(partner_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_payout
  ON public.commissions(payout_id)
  WHERE payout_id IS NOT NULL AND deleted_at IS NULL;

-- NOT VALID avoids rewriting or resetting historical data while enforcing the
-- lifecycle values for new and updated rows. Validate manually after review.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.commissions'::regclass
      AND conname = 'ck_commissions_status'
  ) THEN
    ALTER TABLE public.commissions
      ADD CONSTRAINT ck_commissions_status
      CHECK (status::text IN ('pending', 'approved', 'paid', 'rejected'))
      NOT VALID;
  END IF;
END $$;

-- Optional after the invalid-status verification query returns zero rows:
-- ALTER TABLE public.commissions VALIDATE CONSTRAINT ck_commissions_status;

-- ============================================================================
-- MANUAL VERIFICATION QUERIES (run separately after this migration)
-- ============================================================================

-- 1. Enum values available for commission sources.
-- SELECT e.enumlabel AS source_type
-- FROM pg_type t
-- JOIN pg_enum e ON e.enumtypid = t.oid
-- WHERE t.typname = 'source_type'
-- ORDER BY e.enumsortorder;

-- 2. Confirm booking commissions use bookings.id through source_id.
-- SELECT c.id, c.source_type, c.source_id, b.id AS booking_id,
--        c.partner_id, c.level, c.status
-- FROM public.commissions c
-- LEFT JOIN public.bookings b ON b.id = c.source_id
-- WHERE c.source_type = 'booking' AND c.deleted_at IS NULL
-- ORDER BY c.created_at DESC
-- LIMIT 50;

-- 3. Must return zero duplicate groups before/after index creation.
-- SELECT source_type, source_id, partner_id, level, COUNT(*) AS row_count
-- FROM public.commissions
-- WHERE deleted_at IS NULL
-- GROUP BY source_type, source_id, partner_id, level
-- HAVING COUNT(*) > 1;

-- 4. Must return zero invalid lifecycle rows.
-- SELECT id, status
-- FROM public.commissions
-- WHERE status::text NOT IN ('pending', 'approved', 'paid', 'rejected');

-- 5. Dashboard level income: approved + paid only.
-- SELECT level, SUM(amount) AS level_income
-- FROM public.commissions
-- WHERE status::text IN ('approved', 'paid')
--   AND deleted_at IS NULL
--   AND COALESCE(reversed, FALSE) = FALSE
-- GROUP BY level
-- ORDER BY level;

-- 6. Partner lifecycle totals and wallet reconciliation candidates.
-- SELECT partner_id,
--   SUM(amount) FILTER (WHERE status::text = 'pending') AS pending_earnings,
--   SUM(amount) FILTER (WHERE status::text = 'approved' AND payout_id IS NULL) AS approved_unpaid,
--   SUM(amount) FILTER (WHERE status::text = 'paid') AS paid_earnings
-- FROM public.commissions
-- WHERE deleted_at IS NULL AND COALESCE(reversed, FALSE) = FALSE
-- GROUP BY partner_id;

-- 7. Paid commissions must be linked to a paid payout; should return zero rows.
-- SELECT c.id, c.partner_id, c.payout_id, p.status AS payout_status
-- FROM public.commissions c
-- LEFT JOIN public.payouts p ON p.id = c.payout_id
-- WHERE c.status::text = 'paid'
--   AND c.deleted_at IS NULL
--   AND (c.payout_id IS NULL OR p.status::text <> 'paid');
