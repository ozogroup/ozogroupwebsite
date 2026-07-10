-- ============================================================================
-- KIA Skin Care - Fresh Start Hardening Migration
-- Date: 2026-07-10
-- ============================================================================
-- SAFETY CONTRACT:
--   * Additive and idempotent.
--   * No operational data deletion.
--   * Safe to run before the fresh-start reset.
--   * Does not integrate Razorpay.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Performance indexes used by admin, partner, referral, booking and payout UI
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_referred_by_created
  ON public.bookings(referred_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_partner_code_created
  ON public.bookings(partner_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_treatment_id
  ON public.bookings(treatment_id);

CREATE INDEX IF NOT EXISTS idx_memberships_sponsor_created
  ON public.memberships(sponsor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memberships_membership_status
  ON public.memberships(membership_status);

CREATE INDEX IF NOT EXISTS idx_partners_sponsor_status
  ON public.partners(sponsor_id, status);

CREATE INDEX IF NOT EXISTS idx_partners_status_created
  ON public.partners(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commissions_partner_status_created
  ON public.commissions(partner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commissions_source_type_level
  ON public.commissions(source_type, level);

CREATE INDEX IF NOT EXISTS idx_payouts_partner_status_created
  ON public.payouts(partner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_status_created
  ON public.payouts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_tree_ancestor_level
  ON public.referral_tree(ancestor_id, level);

CREATE INDEX IF NOT EXISTS idx_referral_tree_descendant_level
  ON public.referral_tree(descendant_id, level);

DO $$
BEGIN
  IF to_regclass('public.partner_sales') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_partner_sales_partner_created ON public.partner_sales(partner_id, created_at DESC)';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 2. Uniqueness and integrity constraints
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_partner_code_live
  ON public.partners(upper(partner_code))
  WHERE partner_code IS NOT NULL AND COALESCE(is_active, TRUE) = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_tree_relation_level
  ON public.referral_tree(ancestor_id, descendant_id, level);

CREATE UNIQUE INDEX IF NOT EXISTS uq_commissions_source_partner_level_live
  ON public.commissions(source_type, source_id, partner_id, level)
  WHERE source_id IS NOT NULL AND COALESCE(is_active, TRUE) = TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_referral_tree_no_self'
      AND conrelid = 'public.referral_tree'::regclass
  ) THEN
    ALTER TABLE public.referral_tree
      ADD CONSTRAINT chk_referral_tree_no_self
      CHECK (ancestor_id <> descendant_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_referral_tree_level_positive'
      AND conrelid = 'public.referral_tree'::regclass
  ) THEN
    ALTER TABLE public.referral_tree
      ADD CONSTRAINT chk_referral_tree_level_positive
      CHECK (level >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_payout_deduction_rate_range'
      AND conrelid = 'public.payouts'::regclass
  ) THEN
    ALTER TABLE public.payouts
      ADD CONSTRAINT chk_payout_deduction_rate_range
      CHECK (deduction_rate IS NULL OR (deduction_rate >= 0 AND deduction_rate <= 1));
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- 3. Referral safety function: prevent self-sponsor and circular hierarchy
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kia_prevent_partner_sponsor_loop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sponsor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id = NEW.sponsor_id THEN
    RAISE EXCEPTION 'Partner cannot sponsor self';
  END IF;

  IF EXISTS (
    WITH RECURSIVE sponsor_chain(id, sponsor_id) AS (
      SELECT p.id, p.sponsor_id
      FROM public.partners p
      WHERE p.id = NEW.sponsor_id
      UNION ALL
      SELECT p.id, p.sponsor_id
      FROM public.partners p
      INNER JOIN sponsor_chain sc ON p.id = sc.sponsor_id
      WHERE sc.sponsor_id IS NOT NULL
    )
    SELECT 1 FROM sponsor_chain WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Circular partner sponsor hierarchy is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kia_prevent_partner_sponsor_loop ON public.partners;
CREATE TRIGGER trg_kia_prevent_partner_sponsor_loop
BEFORE INSERT OR UPDATE OF sponsor_id ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.kia_prevent_partner_sponsor_loop();

-- ----------------------------------------------------------------------------
-- 4. RLS posture for sensitive app tables
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles',
    'admins',
    'partners',
    'memberships',
    'bookings',
    'commissions',
    'wallet_transactions',
    'payouts',
    'payments',
    'support_requests',
    'notifications',
    'activity_logs'
  ]
  LOOP
    IF to_regclass('public.' || quote_ident(table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END$$;

-- Public content read policies. Admin/server writes continue through existing
-- admin policies or server-side service role actions.
DO $$
BEGIN
  IF to_regclass('public.treatments') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_treatments ON public.treatments';
    EXECUTE 'CREATE POLICY public_read_active_treatments ON public.treatments FOR SELECT USING (active = TRUE AND deleted_at IS NULL)';
  END IF;

  IF to_regclass('public.site_content') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_site_content ON public.site_content';
    EXECUTE 'CREATE POLICY public_read_active_site_content ON public.site_content FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE)';
  END IF;

  IF to_regclass('public.contact_settings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_contact_settings ON public.contact_settings';
    EXECUTE 'CREATE POLICY public_read_contact_settings ON public.contact_settings FOR SELECT USING (TRUE)';
  END IF;

  IF to_regclass('public.testimonials') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_testimonials ON public.testimonials';
    EXECUTE 'CREATE POLICY public_read_active_testimonials ON public.testimonials FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE)';
  END IF;

  IF to_regclass('public.faqs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_faqs ON public.faqs';
    EXECUTE 'CREATE POLICY public_read_active_faqs ON public.faqs FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE)';
  END IF;
END$$;

COMMIT;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
