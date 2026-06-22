-- ============================================================================
-- KIA Skin Care - Referral Workflow Hardening Migration
-- Date: 2026-06-22
-- ============================================================================
-- SAFETY CONTRACT:
--   * 100% additive + idempotent. No DROP TABLE / DROP COLUMN.
--   * Safe to run multiple times.
--   * Run AFTER taking a Supabase backup (Dashboard > Database > Backups).
--   * Existing data is preserved.
--
-- PURPOSE:
--   * Prevent duplicate commission rows for the same booking + partner + level.
--   * Enforce commission status consistency at database level.
--
-- RUN ORDER: Run AFTER MIGRATION_PRODUCTION_HARDENING_2026_06_22.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1. Unique index to prevent duplicate commissions
--   Ensures no duplicate commission rows for the same booking_id + partner_id + level.
--   This is a safety net for the application-level deduplication in referral-tracking.ts.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'uq_commissions_booking_partner_level'
  ) THEN
    CREATE UNIQUE INDEX uq_commissions_booking_partner_level 
      ON commissions(booking_id, partner_id, level)
      WHERE COALESCE(is_active, TRUE) = TRUE AND COALESCE(reversed, FALSE) = FALSE;
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- STEP 2. Index for commission status filtering (performance)
--   Improves queries filtering by status for dashboard and income pages.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_commissions_status 
  ON commissions(status) 
  WHERE COALESCE(is_active, TRUE) = TRUE AND COALESCE(reversed, FALSE) = FALSE;

-- ----------------------------------------------------------------------------
-- STEP 3. Composite index for partner commission queries
--   Improves queries fetching commissions by partner with status filtering.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_commissions_partner_status 
  ON commissions(partner_id, status) 
  WHERE COALESCE(is_active, TRUE) = TRUE AND COALESCE(reversed, FALSE) = FALSE;

-- ----------------------------------------------------------------------------
-- STEP 4. Check constraint for commission status values
--   Enforces valid status values at database level.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_commissions_status'
  ) THEN
    ALTER TABLE commissions 
      ADD CONSTRAINT ck_commissions_status 
      CHECK (status IN ('pending', 'approved', 'paid', 'rejected'));
  END IF;
END$$;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
