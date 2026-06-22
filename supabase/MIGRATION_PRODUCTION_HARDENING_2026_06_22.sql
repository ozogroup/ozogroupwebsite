-- ============================================================================
-- KIA Skin Care - Production Hardening Migration
-- Date: 2026-06-22
-- ============================================================================
-- SAFETY CONTRACT:
--   * 100% additive + idempotent. No DROP TABLE / DROP COLUMN.
--   * Safe to run multiple times.
--   * Run AFTER taking a Supabase backup (Dashboard > Database > Backups),
--     or rely on the lightweight snapshot tables created in STEP 0.
--   * Existing IDs, partner codes, treatment slugs and data are preserved.
--
-- RUN ORDER: This file can be run on its own in the Supabase SQL Editor.
--            It supersedes scattered prior ALTERs (all guarded by IF NOT EXISTS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 0. Lightweight backup snapshots (only created once; never overwritten)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public._bak_20260622_site_content') IS NULL THEN
    EXECUTE 'CREATE TABLE public._bak_20260622_site_content AS TABLE site_content';
  END IF;
  IF to_regclass('public._bak_20260622_treatments') IS NULL THEN
    EXECUTE 'CREATE TABLE public._bak_20260622_treatments AS TABLE treatments';
  END IF;
  IF to_regclass('public._bak_20260622_commission_settings') IS NULL THEN
    EXECUTE 'CREATE TABLE public._bak_20260622_commission_settings AS TABLE commission_settings';
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- STEP 1. Fix site_content dual-column conflict (Audit C4)
--   Legacy columns content_key / content_value were NOT NULL, blocking the
--   admin CMS from inserting new fields (which only set key_name / value).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Ensure new columns exist
  ALTER TABLE site_content ADD COLUMN IF NOT EXISTS key_name TEXT;
  ALTER TABLE site_content ADD COLUMN IF NOT EXISTS value TEXT;
  ALTER TABLE site_content ADD COLUMN IF NOT EXISTS value_type TEXT DEFAULT 'text';
  ALTER TABLE site_content ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
  ALTER TABLE site_content ADD COLUMN IF NOT EXISTS page TEXT;

  -- Drop NOT NULL from legacy columns if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'content_key' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE site_content ALTER COLUMN content_key DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'content_value' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE site_content ALTER COLUMN content_value DROP NOT NULL;
  END IF;
END$$;

-- Backfill key_name / value from legacy columns where missing
UPDATE site_content
SET key_name = COALESCE(key_name, content_key),
    value = COALESCE(value, NULLIF(trim(both '"' from content_value::text), 'null'))
WHERE key_name IS NULL OR value IS NULL;

-- Keep legacy columns mirrored so old readers don't break
UPDATE site_content
SET content_key = COALESCE(content_key, key_name)
WHERE content_key IS NULL AND key_name IS NOT NULL;

-- Unique key used by ON CONFLICT (section, key_name) across the codebase
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_content_section_key
  ON site_content(section, key_name);
CREATE INDEX IF NOT EXISTS idx_site_content_section_key
  ON site_content(section, key_name);
CREATE INDEX IF NOT EXISTS idx_site_content_display_order
  ON site_content(section, display_order);

-- ----------------------------------------------------------------------------
-- STEP 2. Treatments: ensure every CMS/public field exists (Audit B)
-- ----------------------------------------------------------------------------
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS kit_name TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS price_label TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS who_for TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS safety TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS process JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS included_products JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS image_alt TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS before_image_url TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS after_image_url TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_type TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- treatments.slug uniqueness (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_treatments_slug'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'treatments_slug_key'
  ) THEN
    CREATE UNIQUE INDEX uq_treatments_slug ON treatments(slug);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_treatments_sort_order ON treatments(sort_order);
CREATE INDEX IF NOT EXISTS idx_treatments_featured_active ON treatments(featured) WHERE active = TRUE;

-- ----------------------------------------------------------------------------
-- STEP 3. treatment_images: normalized gallery (Audit B / I)
--   Mirrors treatments.gallery JSON for ordered, deletable image rows.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_treatment_images_treatment ON treatment_images(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_images_sort ON treatment_images(treatment_id, sort_order);

-- ----------------------------------------------------------------------------
-- STEP 4. media_library catalog (Audit I) - tracks uploaded assets + usage
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  folder TEXT DEFAULT 'general',
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(folder);
CREATE INDEX IF NOT EXISTS idx_media_library_created ON media_library(created_at);

-- ----------------------------------------------------------------------------
-- STEP 5. updated_at triggers for tables added by later migrations
-- ----------------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['testimonials','faqs','franchise_leads','partner_sales','treatment_images'])
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'updated_at') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
      EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END IF;
  END LOOP;
END$$;

-- ----------------------------------------------------------------------------
-- STEP 6. Commission settings helper (Audit C5/D)
--   Single source of truth for live L1-L4 percentages, consumed by app code.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_commission_percentages()
RETURNS TABLE (level_1 NUMERIC, level_2 NUMERIC, level_3 NUMERIC, level_4 NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT
    COALESCE(level_1_percentage, 6.00),
    COALESCE(level_2_percentage, 3.00),
    COALESCE(level_3_percentage, 1.70),
    COALESCE(level_4_percentage, 1.20)
  FROM commission_settings
  WHERE active = TRUE
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- STEP 7. Reporting views (Audit K) - real, no hardcoded values
-- ----------------------------------------------------------------------------
-- Paid booking sales = bookings paid AND confirmed/completed
CREATE OR REPLACE VIEW v_admin_booking_sales AS
SELECT
  COALESCE(SUM(COALESCE(payment_amount, 0)), 0) AS paid_booking_sales,
  COUNT(*) FILTER (WHERE payment_status = 'paid' AND booking_status IN ('confirmed','completed')) AS paid_bookings_count,
  COUNT(*) AS total_bookings
FROM bookings
WHERE COALESCE(is_active, TRUE) = TRUE
  AND payment_status = 'paid'
  AND booking_status IN ('confirmed','completed');

-- Commission income split by level (all-time)
CREATE OR REPLACE VIEW v_admin_commission_by_level AS
SELECT
  level,
  COALESCE(SUM(amount), 0) AS total_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount,
  COALESCE(SUM(amount) FILTER (WHERE status IN ('approved','paid')), 0) AS approved_amount,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS paid_amount
FROM commissions
WHERE COALESCE(is_active, TRUE) = TRUE AND COALESCE(reversed, FALSE) = FALSE
GROUP BY level;

-- Wallet + payout rollup
CREATE OR REPLACE VIEW v_admin_wallet_summary AS
SELECT
  COALESCE(SUM(wallet_balance), 0) AS total_wallet_balance,
  COALESCE(SUM(total_earnings), 0) AS total_earnings,
  COALESCE(SUM(paid_earnings), 0) AS total_paid_earnings
FROM partners
WHERE COALESCE(is_active, TRUE) = TRUE;

CREATE OR REPLACE VIEW v_admin_payout_summary AS
SELECT
  COALESCE(SUM(amount) FILTER (WHERE status IN ('requested','processing')), 0) AS pending_payouts,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS paid_payouts
FROM payouts
WHERE COALESCE(is_active, TRUE) = TRUE;

-- ----------------------------------------------------------------------------
-- STEP 8. Public-read RLS for content tables (Audit J)
--   Public can read ACTIVE content. Writes remain admin/service-role only.
--   Idempotent: drop + recreate the named policies.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- treatments
  IF to_regclass('public.treatments') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE treatments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_treatments ON treatments';
    EXECUTE 'CREATE POLICY public_read_active_treatments ON treatments FOR SELECT USING (active = TRUE AND deleted_at IS NULL)';
  END IF;

  -- testimonials
  IF to_regclass('public.testimonials') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_testimonials ON testimonials';
    EXECUTE 'CREATE POLICY public_read_active_testimonials ON testimonials FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE)';
  END IF;

  -- faqs
  IF to_regclass('public.faqs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE faqs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_faqs ON faqs';
    EXECUTE 'CREATE POLICY public_read_active_faqs ON faqs FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE)';
  END IF;

  -- site_content
  IF to_regclass('public.site_content') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE site_content ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_active_site_content ON site_content';
    EXECUTE 'CREATE POLICY public_read_active_site_content ON site_content FOR SELECT USING (COALESCE(is_active, TRUE) = TRUE)';
  END IF;

  -- contact_settings
  IF to_regclass('public.contact_settings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_contact_settings ON contact_settings';
    EXECUTE 'CREATE POLICY public_read_contact_settings ON contact_settings FOR SELECT USING (TRUE)';
  END IF;

  -- commission_settings (public reads active for the membership page)
  IF to_regclass('public.commission_settings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS public_read_commission_settings ON commission_settings';
    EXECUTE 'CREATE POLICY public_read_commission_settings ON commission_settings FOR SELECT USING (active = TRUE)';
  END IF;

  -- treatment_images
  EXECUTE 'ALTER TABLE treatment_images ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS public_read_treatment_images ON treatment_images';
  EXECUTE 'CREATE POLICY public_read_treatment_images ON treatment_images FOR SELECT USING (TRUE)';
END$$;

-- ----------------------------------------------------------------------------
-- STEP 9. Storage bucket "media" + policies (Audit I)
--   Public read; writes restricted to authenticated admins.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DO $$
BEGIN
  -- public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_public_read') THEN
    CREATE POLICY media_public_read ON storage.objects
      FOR SELECT USING (bucket_id = 'media');
  END IF;

  -- admin write/update/delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_admin_write') THEN
    CREATE POLICY media_admin_write ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'media'
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin'))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_admin_modify') THEN
    CREATE POLICY media_admin_modify ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'media'
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin'))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_admin_delete') THEN
    CREATE POLICY media_admin_delete ON storage.objects
      FOR DELETE USING (
        bucket_id = 'media'
        AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin'))
      );
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- STEP 10. Search/filter indexes (Audit F/D)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_partners_wallet ON partners(wallet_balance);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_commissions_level ON commissions(level);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='customer_email') THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email);
  END IF;
END$$;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
