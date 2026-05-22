-- ============================================================================
-- OZO Service - Partner System, KYC, Kit Tracking, and Booking Cleanup
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Treatment catalog extensions
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS kit_name TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_type TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS process JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS who_for JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE treatments
  ALTER COLUMN who_for TYPE JSONB
  USING CASE
    WHEN who_for IS NULL OR btrim(who_for::text) = '' THEN '[]'::jsonb
    WHEN left(btrim(who_for::text), 1) IN ('[', '{') THEN who_for::jsonb
    ELSE to_jsonb(ARRAY[who_for::text])
  END;

CREATE INDEX IF NOT EXISTS idx_treatments_featured ON treatments(featured) WHERE active = TRUE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_treatments_kit_name ON treatments(kit_name);

-- Booking cleanup and denormalized sale fields
ALTER TABLE bookings DROP COLUMN IF EXISTS preferred_time;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS treatment_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS treatment_price NUMERIC(15, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS partner_code TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_code ON bookings(partner_code);

-- Partner membership validity and KYC details
ALTER TABLE partners ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS membership_extended_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS membership_extension_note TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS bank_branch_name TEXT;

UPDATE partners
SET
  membership_started_at = COALESCE(membership_started_at, membership_purchased_at, created_at),
  membership_expires_at = COALESCE(membership_expires_at, COALESCE(membership_purchased_at, created_at) + INTERVAL '1 year')
WHERE membership_started_at IS NULL OR membership_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_partners_membership_expires ON partners(membership_expires_at);
CREATE INDEX IF NOT EXISTS idx_partners_kyc_status ON partners(kyc_status);

-- Partner treatment/kit sale ledger
CREATE TABLE IF NOT EXISTS partner_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_code TEXT NOT NULL,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  treatment_name TEXT NOT NULL,
  kit_name TEXT,
  treatment_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  booking_status booking_status NOT NULL DEFAULT 'pending',
  commission_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sales_partner ON partner_sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_code ON partner_sales(partner_code);
CREATE INDEX IF NOT EXISTS idx_partner_sales_booking_status ON partner_sales(booking_status);
CREATE INDEX IF NOT EXISTS idx_partner_sales_created ON partner_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_sales_kit ON partner_sales(kit_name);

DROP TRIGGER IF EXISTS trg_partner_sales_updated_at ON partner_sales;
CREATE TRIGGER trg_partner_sales_updated_at
  BEFORE UPDATE ON partner_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Private KYC submissions/documents
CREATE TABLE IF NOT EXISTS partner_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID UNIQUE NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_ifsc TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  upi_id TEXT,
  pan_card_path TEXT,
  aadhaar_front_path TEXT,
  aadhaar_back_path TEXT,
  status kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_kyc_partner ON partner_kyc(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_kyc_status ON partner_kyc(status);
CREATE INDEX IF NOT EXISTS idx_partner_kyc_created ON partner_kyc(created_at);

DROP TRIGGER IF EXISTS trg_partner_kyc_updated_at ON partner_kyc;
CREATE TRIGGER trg_partner_kyc_updated_at
  BEFORE UPDATE ON partner_kyc
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payout audit fields
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS transaction_note TEXT;

-- Storage bucket for private KYC files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- Seed requested treatment/kit catalog. Existing rows are updated by slug.
UPDATE treatments
SET active = FALSE,
    is_active = FALSE,
    deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE slug NOT IN (
  'advance-kit',
  'japanese-kit',
  'korean-glass-kit',
  'basic-kit',
  'korean-glass-treatment'
);

INSERT INTO treatments (
  slug, title, kit_name, type, treatment_type, price, price_label, unit, tagline,
  description, overview, benefits, process, who_for, duration, sessions, badge,
  image, image_alt, active, is_active, featured
)
VALUES
  ('advance-kit', 'Advance Kit', 'Advance Kit', 'home_kit', 'home-kit', 18000, '₹18,000', 'complete kit', 'Advanced Home Kit',
   'Advanced skincare kit designed for enhanced glow and visible skin improvement.',
   'Advanced skincare kit designed for enhanced glow and visible skin improvement.',
   '["Advanced skin repair","Pigmentation support","Premium guided home care"]'::jsonb,
   '[]'::jsonb, '["Advanced home-care clients","Pigmentation and repair focused users"]'::jsonb,
   '4-6 weeks', 'Complete kit program', 'Premium Kit',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
   'Advance skincare kit', TRUE, TRUE, TRUE),
  ('japanese-kit', 'Japanese Kit', 'Japanese Kit', 'home_kit', 'home-kit', 22000, '₹22,000', 'complete kit', 'Japanese Ritual Kit',
   'Premium Japanese-inspired skincare kit for refined texture and smooth skin appearance.',
   'Premium Japanese-inspired skincare kit for refined texture and smooth skin appearance.',
   '["Texture refinement","Calm clear skin","Balanced glow"]'::jsonb,
   '[]'::jsonb, '["Sensitive skin","Texture refinement","Refined glow seekers"]'::jsonb,
   '4-6 weeks', 'Complete kit program', 'Japanese Care',
   'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80',
   'Japanese skincare kit', TRUE, TRUE, FALSE),
  ('korean-glass-kit', 'Korean Glass Kit', 'Korean Glass Kit', 'home_kit', 'home-kit', 15000, '₹15,000', 'complete kit', 'Glass Glow Home Kit',
   'Kit-based Korean glass skin care option for a fresh, radiant look.',
   'Kit-based Korean glass skin care option for a fresh, radiant look.',
   '["Glass-skin glow","Hydration support","Dewy finish"]'::jsonb,
   '[]'::jsonb, '["Dull skin","Hydration seekers","K-beauty glow lovers"]'::jsonb,
   '4-6 weeks', 'Complete kit program', 'Glass Kit',
   'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
   'Korean glass skincare kit', TRUE, TRUE, TRUE),
  ('basic-kit', 'Basic Kit', 'Basic Kit', 'home_kit', 'home-kit', 14000, '₹14,000', 'complete kit', 'Essential Skin Kit',
   'Essential skincare kit for regular care and beginner-level treatment support.',
   'Essential skincare kit for regular care and beginner-level treatment support.',
   '["Beginner friendly","Glow maintenance","Hydration and cleansing"]'::jsonb,
   '[]'::jsonb, '["First-time skincare clients","Maintenance care","All skin types"]'::jsonb,
   '4-6 weeks', 'Complete kit program', 'Essential',
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
   'Basic skincare kit', TRUE, TRUE, FALSE),
  ('korean-glass-treatment', 'Korean Glass Treatment Campaign', 'Korean Glass Treatment Campaign', 'campaign', 'camp', 25000, '₹25,000', 'per session', 'Premium Clinical Glow Experience',
   'Campaign/location-based premium Korean glass treatment. Our team will contact you on WhatsApp with campaign date and location details.',
   'Campaign/location-based premium Korean glass treatment. Our team will contact you on WhatsApp with campaign date and location details.',
   '["Deep hydration glow","Glass skin finish","Skin texture refinement"]'::jsonb,
   '[]'::jsonb, '["Pre-event glow seekers","Dry or dull skin","Premium clinical care clients"]'::jsonb,
   '75-90 min', 'Event-based sessions', 'Premium',
   'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
   'Korean Glass Treatment Campaign', TRUE, TRUE, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  kit_name = EXCLUDED.kit_name,
  type = EXCLUDED.type,
  treatment_type = EXCLUDED.treatment_type,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  unit = EXCLUDED.unit,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  overview = EXCLUDED.overview,
  benefits = EXCLUDED.benefits,
  who_for = EXCLUDED.who_for,
  duration = EXCLUDED.duration,
  sessions = EXCLUDED.sessions,
  badge = EXCLUDED.badge,
  image = EXCLUDED.image,
  image_alt = EXCLUDED.image_alt,
  active = TRUE,
  is_active = TRUE,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- RLS
ALTER TABLE partner_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_kyc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_sales_partner_read_own" ON partner_sales;
CREATE POLICY "partner_sales_partner_read_own"
ON partner_sales FOR SELECT
USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_sales_admin_read_all" ON partner_sales;
CREATE POLICY "partner_sales_admin_read_all"
ON partner_sales FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')));

DROP POLICY IF EXISTS "partner_sales_admin_write" ON partner_sales;
CREATE POLICY "partner_sales_admin_write"
ON partner_sales FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "partner_kyc_partner_read_own" ON partner_kyc;
CREATE POLICY "partner_kyc_partner_read_own"
ON partner_kyc FOR SELECT
USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_kyc_partner_upsert_own" ON partner_kyc;
CREATE POLICY "partner_kyc_partner_upsert_own"
ON partner_kyc FOR INSERT
WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_kyc_partner_update_own_pending" ON partner_kyc;
CREATE POLICY "partner_kyc_partner_update_own_pending"
ON partner_kyc FOR UPDATE
USING (auth.uid() = partner_id AND status IN ('not_submitted', 'pending', 'rejected'));

DROP POLICY IF EXISTS "partner_kyc_admin_read_all" ON partner_kyc;
CREATE POLICY "partner_kyc_admin_read_all"
ON partner_kyc FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')));

DROP POLICY IF EXISTS "partner_kyc_admin_write" ON partner_kyc;
CREATE POLICY "partner_kyc_admin_write"
ON partner_kyc FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Storage policies: private KYC files are readable only by owner/admin via signed URLs.
DROP POLICY IF EXISTS "kyc_partner_upload_own_folder" ON storage.objects;
CREATE POLICY "kyc_partner_upload_own_folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "kyc_partner_read_own_folder" ON storage.objects;
CREATE POLICY "kyc_partner_read_own_folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "kyc_admin_read_all" ON storage.objects;
CREATE POLICY "kyc_admin_read_all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff'))
);

-- Keep partner_sales booking status synced when admins update bookings.
CREATE OR REPLACE FUNCTION sync_partner_sale_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partner_sales
  SET booking_status = NEW.booking_status, updated_at = NOW()
  WHERE booking_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_partner_sale_booking_status ON bookings;
CREATE TRIGGER trg_sync_partner_sale_booking_status
  AFTER UPDATE OF booking_status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_partner_sale_booking_status();



