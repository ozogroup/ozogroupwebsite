-- OZO / IA Skin Care - Admin Panel Database Setup
-- This SQL file creates all required tables for the admin panel

-- =====================================================
-- SITE CONTENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(100) NOT NULL, -- 'home_hero', 'home_treatment', 'home_membership', 'home_referral', 'about', 'membership', 'contact'
  key_name VARCHAR(100) NOT NULL, -- 'title', 'subtitle', 'description', 'image', 'cta_text', 'cta_link', etc.
  value TEXT,
  value_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image_url', 'html'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, key_name)
);

-- =====================================================
-- TREATMENTS / SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'home_kit', 'clinic', 'campaign'
  price DECIMAL(10, 2) NOT NULL,
  price_label TEXT,
  kit_name TEXT,
  unit TEXT,
  tagline VARCHAR(255),
  subtitle TEXT,
  description TEXT,
  overview TEXT,
  benefits JSONB DEFAULT '[]',
  process JSONB DEFAULT '[]',
  who_for JSONB DEFAULT '[]',
  safety TEXT,
  duration VARCHAR(100),
  sessions VARCHAR(100),
  badge TEXT,
  icon TEXT,
  tone TEXT,
  image TEXT,
  image_alt TEXT,
  active BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  requires_slots BOOLEAN DEFAULT false,
  available_cities JSONB DEFAULT '[]',
  cta_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  treatment_id UUID REFERENCES treatments(id),
  treatment_name VARCHAR(255),
  preferred_date DATE,
  city VARCHAR(100),
  referral_code VARCHAR(50),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'confirmed', 'completed', 'cancelled'
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEMBERSHIP REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  city VARCHAR(100),
  address TEXT,
  pin_code VARCHAR(10),
  referral_code_used VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  membership_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'active'
  generated_referral_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PARTNERS TABLE (Referral Partners)
-- =====================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  partner_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referral_link TEXT,
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_commission DECIMAL(12, 2) DEFAULT 0,
  pending_payout DECIMAL(12, 2) DEFAULT 0,
  paid_payout DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'disabled', 'pending'
  sponsor_code VARCHAR(50),
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_mobile VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  commission_amount DECIMAL(10, 2) DEFAULT 500,
  commission_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
  is_milestone_referral BOOLEAN DEFAULT false,
  milestone_level INTEGER, -- 10, 20, 30
  milestone_bonus DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  referral_id UUID REFERENCES referrals(id),
  customer_name VARCHAR(255),
  commission_amount DECIMAL(10, 2) NOT NULL,
  commission_type VARCHAR(50), -- 'direct', 'milestone'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  partner_name VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50), -- 'upi', 'bank_transfer'
  payment_details TEXT, -- UPI ID or bank details
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
  transaction_id VARCHAR(100),
  paid_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TESTIMONIALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FAQs TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTACT SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  business_hours TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEDIA ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- 'image', 'video', 'document'
  file_size INTEGER,
  category VARCHAR(100), -- 'treatment', 'hero', 'about', 'general'
  alt_text VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_treatments_active ON treatments(active);
CREATE INDEX IF NOT EXISTS idx_treatments_type ON treatments(type);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_treatment ON bookings(treatment_id);
CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(membership_status);
CREATE INDEX IF NOT EXISTS idx_partners_referral_code ON partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_referrals_partner ON referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_commissions_partner ON commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_payouts_partner ON payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);

-- =====================================================
-- INITIAL SITE CONTENT SEED DATA
-- =====================================================
INSERT INTO site_content (section, key_name, value, value_type, display_order) VALUES
-- Home Hero
('home_hero', 'title', 'Transform Your Skin with Korean Beauty Secrets', 'text', 1),
('home_hero', 'subtitle', 'Premium Treatment Kits by IA Skin Care', 'text', 2),
('home_hero', 'description', 'Experience the power of Korean glass skin treatments and advanced skincare solutions tailored for your unique beauty needs.', 'text', 3),
('home_hero', 'cta_text', 'Book Consultation', 'text', 4),
('home_hero', 'cta_link', '/contact', 'text', 5),

-- Treatment Section
('home_treatment', 'heading', 'Our Premium Treatments', 'text', 1),
('home_treatment', 'subtitle', 'Discover our range of advanced skincare treatments', 'text', 2),

-- Membership Section
('home_membership', 'heading', 'Become a Partner', 'text', 1),
('home_membership', 'subtitle', 'Earn while you refer friends and family', 'text', 2),
('home_membership', 'price', '₹5,000', 'text', 3),
('home_membership', 'earning_text', 'Earn ₹500 per successful referral + milestone bonuses', 'text', 4),
('home_membership', 'cta_text', 'Join Now', 'text', 5),
('home_membership', 'cta_link', '/membership', 'text', 6),

-- Referral Section
('home_referral', 'heading', 'Refer and Earn', 'text', 1),
('home_referral', 'subtitle', 'Share your unique referral code and earn commissions', 'text', 2),

-- About Page
('about', 'title', 'About IA Skin Care', 'text', 1),
('about', 'description', 'We are dedicated to bringing you the best in Korean skincare technology combined with personalized care for radiant, healthy skin.', 'text', 2),
('about', 'mission', 'To provide world-class skincare treatments that are accessible, effective, and tailored to individual needs.', 'text', 3),
('about', 'vision', 'To become India''s leading destination for advanced Korean skincare treatments.', 'text', 4),

-- Contact
('contact', 'phone', '+91 98765 43210', 'text', 1),
('contact', 'whatsapp', '+91 98765 43210', 'text', 2),
('contact', 'email', 'contact@ia-skincare.com', 'text', 3),
('contact', 'address', '123 Beauty Street, Mumbai, Maharashtra 400001', 'text', 4),
('contact', 'business_hours', 'Mon - Sat: 10:00 AM - 7:00 PM', 'text', 5)
ON CONFLICT (section, key_name) DO NOTHING;

-- =====================================================
-- INITIAL TREATMENTS SEED DATA
-- =====================================================
UPDATE treatments
SET active = false,
    is_active = false,
    deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE slug NOT IN ('advance-kit', 'japanese-kit', 'korean-glass-kit', 'basic-kit', 'korean-glass-treatment');

INSERT INTO treatments (title, slug, kit_name, type, price, price_label, unit, tagline, subtitle, description, overview, benefits, duration, sessions, image, image_alt, active, featured, requires_slots, available_cities, cta_text) VALUES
('Advance Kit', 'advance-kit', 'Advance Kit', 'home_kit', 18000, '₹18,000', 'complete kit', 'Advanced Home Kit', 'Advanced Home Kit', 'A premium advanced skincare kit designed for guided home-care transformation.', 'A complete advanced home-care kit with premium clinical-grade products and support.', '["Advanced skin repair", "Pigmentation support", "Premium guided home care", "Visible radiance"]', '4-6 weeks', 'Complete kit program', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80', 'Advance skincare kit', true, true, false, '["All India"]', 'Book Advance Kit'),
('Japanese Kit', 'japanese-kit', 'Japanese Kit', 'home_kit', 22000, '₹22,000', 'complete kit', 'Japanese Ritual Kit', 'Japanese Ritual Kit', 'A refined Japanese-inspired skincare kit for calm, clear, porcelain-like radiance.', 'A luxury home-care kit inspired by Japanese skincare rituals and gentle refinement.', '["Texture refinement", "Calm clear skin", "Balanced glow", "Gentle home ritual"]', '4-6 weeks', 'Complete kit program', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80', 'Japanese skincare kit', true, false, false, '["All India"]', 'Book Japanese Kit'),
('Korean Glass Kit', 'korean-glass-kit', 'Korean Glass Kit', 'home_kit', 15000, '₹15,000', 'complete kit', 'Glass Glow Home Kit', 'Glass Glow Home Kit', 'A Korean glass-skin inspired home kit for hydrated, luminous, dewy skin.', 'A complete Korean-inspired home-care kit for dewy hydration and everyday radiance.', '["Glass-skin glow", "Hydration support", "Dewy finish", "K-beauty inspired care"]', '4-6 weeks', 'Complete kit program', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80', 'Korean glass skincare kit', true, true, false, '["All India"]', 'Book Korean Glass Kit'),
('Basic Kit', 'basic-kit', 'Basic Kit', 'home_kit', 14000, '₹14,000', 'complete kit', 'Essential Skin Kit', 'Essential Skin Kit', 'An essential skincare kit for foundational cleansing, hydration, and glow maintenance.', 'A premium starter kit for healthy skin routines and visible daily freshness.', '["Beginner friendly", "Glow maintenance", "Hydration and cleansing", "All-skin support"]', '4-6 weeks', 'Complete kit program', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80', 'Basic skincare kit', true, false, false, '["All India"]', 'Book Basic Kit'),
('Korean Glass Treatment', 'korean-glass-treatment', 'Korean Glass Treatment', 'clinic', 25000, '₹25,000', 'per session', 'Premium Clinical Glow Experience', 'Premium Clinical Glow Experience', 'A premium Korean glass-skin clinical treatment for luminous, dewy, event-ready radiance.', 'A doctor-supervised premium protocol focused on hydration, refinement, and the signature glass-skin finish.', '["Deep hydration glow", "Glass skin finish", "Skin texture refinement", "Premium clinical care"]', '75-90 min', 'Event-based sessions', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80', 'Korean Glass Treatment', true, true, true, '["Mumbai", "Delhi", "Bangalore", "Ahmedabad"]', 'Book Korean Glass Treatment')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  kit_name = EXCLUDED.kit_name,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  unit = EXCLUDED.unit,
  tagline = EXCLUDED.tagline,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  overview = EXCLUDED.overview,
  benefits = EXCLUDED.benefits,
  duration = EXCLUDED.duration,
  sessions = EXCLUDED.sessions,
  image = EXCLUDED.image,
  image_alt = EXCLUDED.image_alt,
  active = TRUE,
  featured = EXCLUDED.featured,
  requires_slots = EXCLUDED.requires_slots,
  available_cities = EXCLUDED.available_cities,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();

-- =====================================================
-- INITIAL CONTACT SETTINGS SEED DATA
-- =====================================================
INSERT INTO contact_settings (phone, whatsapp, email, address, business_hours, facebook_url, instagram_url) VALUES
('+91 98765 43210', '+91 98765 43210', 'contact@ia-skincare.com', '123 Beauty Street, Mumbai, Maharashtra 400001', 'Mon - Sat: 10:00 AM - 7:00 PM', 'https://facebook.com/ia-skincare', 'https://instagram.com/ia-skincare')
ON CONFLICT DO NOTHING;
