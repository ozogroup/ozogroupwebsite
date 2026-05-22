-- ============================================================================
-- OZO Service - Exact Treatment / Kit Pricing Update
-- ============================================================================
-- Run this in the Supabase SQL Editor for production.
-- It keeps existing booking history intact by archiving old treatment rows
-- instead of deleting rows that may be referenced by bookings.
-- ============================================================================

ALTER TABLE treatments ADD COLUMN IF NOT EXISTS kit_name TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS price_label TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_type TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS process JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS who_for JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS safety TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS image_alt TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE treatments
  ALTER COLUMN who_for TYPE JSONB
  USING CASE
    WHEN who_for IS NULL OR btrim(who_for::text) = '' THEN '[]'::jsonb
    WHEN left(btrim(who_for::text), 1) IN ('[', '{') THEN who_for::jsonb
    ELSE to_jsonb(ARRAY[who_for::text])
  END;

UPDATE treatments
SET active = false,
    is_active = false,
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
  slug, title, kit_name, type, treatment_type, price, price_label, unit,
  tagline, subtitle, description, overview, benefits, process, who_for, safety,
  duration, sessions, badge, icon, tone, image, image_alt, active, is_active,
  deleted_at, featured, requires_slots, available_cities, cta_text, updated_at
)
VALUES
  (
    'advance-kit', 'Advance Kit', 'Advance Kit', 'home_kit', 'home-kit',
    18000, '₹18,000', 'complete kit', 'Advanced Home Kit', 'Advanced Home Kit',
    'A premium advanced skincare kit designed for guided home-care transformation.',
    'A complete advanced home-care kit with premium clinical-grade products and support.',
    '["Advanced skin repair","Pigmentation support","Premium guided home care","Visible radiance"]'::jsonb,
    '[]'::jsonb,
    '["Advanced home-care clients","Pigmentation and repair focused users"]'::jsonb,
    'Doctor-guided and patch-tested for responsible home use.',
    '4-6 weeks', 'Complete kit program', 'Premium Kit', 'award', 'primaryDark',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
    'Advance skincare kit', true, true, null, true, false,
    '["All India"]'::jsonb, 'Book Advance Kit', NOW()
  ),
  (
    'japanese-kit', 'Japanese Kit', 'Japanese Kit', 'home_kit', 'home-kit',
    22000, '₹22,000', 'complete kit', 'Japanese Ritual Kit', 'Japanese Ritual Kit',
    'A refined Japanese-inspired skincare kit for calm, clear, porcelain-like radiance.',
    'A luxury home-care kit inspired by Japanese skincare rituals and gentle refinement.',
    '["Texture refinement","Calm clear skin","Balanced glow","Gentle home ritual"]'::jsonb,
    '[]'::jsonb,
    '["Sensitive skin","Texture refinement","Refined glow seekers"]'::jsonb,
    'Gentle, guided, and suitable for premium home-care routines.',
    '4-6 weeks', 'Complete kit program', 'Japanese Care', 'sparkle', 'light',
    'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80',
    'Japanese skincare kit', true, true, null, false, false,
    '["All India"]'::jsonb, 'Book Japanese Kit', NOW()
  ),
  (
    'korean-glass-kit', 'Korean Glass Kit', 'Korean Glass Kit', 'home_kit', 'home-kit',
    15000, '₹15,000', 'complete kit', 'Glass Glow Home Kit', 'Glass Glow Home Kit',
    'A Korean glass-skin inspired home kit for hydrated, luminous, dewy skin.',
    'A complete Korean-inspired home-care kit for dewy hydration and everyday radiance.',
    '["Glass-skin glow","Hydration support","Dewy finish","K-beauty inspired care"]'::jsonb,
    '[]'::jsonb,
    '["Dull skin","Hydration seekers","K-beauty glow lovers"]'::jsonb,
    'Patch-tested, guided home care for visible glow.',
    '4-6 weeks', 'Complete kit program', 'Glass Kit', 'sparkle', 'accent',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
    'Korean glass skincare kit', true, true, null, true, false,
    '["All India"]'::jsonb, 'Book Korean Glass Kit', NOW()
  ),
  (
    'basic-kit', 'Basic Kit', 'Basic Kit', 'home_kit', 'home-kit',
    14000, '₹14,000', 'complete kit', 'Essential Skin Kit', 'Essential Skin Kit',
    'An essential skincare kit for foundational cleansing, hydration, and glow maintenance.',
    'A premium starter kit for healthy skin routines and visible daily freshness.',
    '["Beginner friendly","Glow maintenance","Hydration and cleansing","All-skin support"]'::jsonb,
    '[]'::jsonb,
    '["First-time skincare clients","Maintenance care","All skin types"]'::jsonb,
    'Gentle, simple, and designed for guided everyday use.',
    '4-6 weeks', 'Complete kit program', 'Essential', 'droplet', 'primary',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
    'Basic skincare kit', true, true, null, false, false,
    '["All India"]'::jsonb, 'Book Basic Kit', NOW()
  ),
  (
    'korean-glass-treatment', 'Korean Glass Treatment', 'Korean Glass Treatment', 'clinic', 'camp',
    25000, '₹25,000', 'per session', 'Premium Clinical Glow Experience', 'Premium Clinical Glow Experience',
    'A premium Korean glass-skin clinical treatment for luminous, dewy, event-ready radiance.',
    'A doctor-supervised premium protocol focused on hydration, refinement, and the signature glass-skin finish.',
    '["Deep hydration glow","Glass skin finish","Skin texture refinement","Premium clinical care"]'::jsonb,
    '[]'::jsonb,
    '["Pre-event glow seekers","Dry or dull skin","Premium clinical care clients"]'::jsonb,
    'Doctor-supervised and delivered in premium clinical settings.',
    '75-90 min', 'Event-based sessions', 'Premium', 'sparkle', 'accent',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
    'Korean Glass Treatment', true, true, null, true, true,
    '["Mumbai","Delhi","Bangalore","Ahmedabad"]'::jsonb, 'Book Korean Glass Treatment', NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  kit_name = EXCLUDED.kit_name,
  type = EXCLUDED.type,
  treatment_type = EXCLUDED.treatment_type,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  unit = EXCLUDED.unit,
  tagline = EXCLUDED.tagline,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  overview = EXCLUDED.overview,
  benefits = EXCLUDED.benefits,
  process = EXCLUDED.process,
  who_for = EXCLUDED.who_for,
  safety = EXCLUDED.safety,
  duration = EXCLUDED.duration,
  sessions = EXCLUDED.sessions,
  badge = EXCLUDED.badge,
  icon = EXCLUDED.icon,
  tone = EXCLUDED.tone,
  image = EXCLUDED.image,
  image_alt = EXCLUDED.image_alt,
  active = true,
  is_active = true,
  deleted_at = null,
  featured = EXCLUDED.featured,
  requires_slots = EXCLUDED.requires_slots,
  available_cities = EXCLUDED.available_cities,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();
