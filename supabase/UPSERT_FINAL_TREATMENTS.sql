-- Final OZO treatment catalog.
-- Run in Supabase SQL editor if Admin > Treatments is empty or out of sync.

ALTER TABLE treatments ADD COLUMN IF NOT EXISTS kit_name TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_type TEXT;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS process JSONB DEFAULT '[]'::jsonb;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS icon TEXT;

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
  description, overview, benefits, process, duration, sessions, badge,
  image, image_alt, active, is_active, featured, requires_slots, available_cities, deleted_at
)
VALUES
  ('advance-kit', 'Advance Kit', 'Advance Kit', 'home_kit', 'home-kit', 18000, '₹18,000', 'complete kit', 'Advanced Home Kit',
   'Advanced skincare kit designed for enhanced glow and visible skin improvement.',
   'Advanced skincare kit designed for enhanced glow and visible skin improvement.',
   '["Advanced skin repair","Pigmentation support","Premium guided home care","Visible radiance"]'::jsonb,
   '[]'::jsonb, '4-6 weeks', 'Complete kit program', 'Premium Kit',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
   'Advance skincare kit', TRUE, TRUE, TRUE, FALSE, '["All India"]'::jsonb, NULL),
  ('japanese-kit', 'Japanese Kit', 'Japanese Kit', 'home_kit', 'home-kit', 22000, '₹22,000', 'complete kit', 'Japanese Ritual Kit',
   'Premium Japanese-inspired skincare kit for refined texture and smooth skin appearance.',
   'Premium Japanese-inspired skincare kit for refined texture and smooth skin appearance.',
   '["Texture refinement","Calm clear skin","Balanced glow","Gentle home ritual"]'::jsonb,
   '[]'::jsonb, '4-6 weeks', 'Complete kit program', 'Japanese Care',
   'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80',
   'Japanese skincare kit', TRUE, TRUE, FALSE, FALSE, '["All India"]'::jsonb, NULL),
  ('korean-glass-kit', 'Korean Glass Kit', 'Korean Glass Kit', 'home_kit', 'home-kit', 15000, '₹15,000', 'complete kit', 'Glass Glow Home Kit',
   'Kit-based Korean glass skin care option for a fresh, radiant look.',
   'Kit-based Korean glass skin care option for a fresh, radiant look.',
   '["Glass-skin glow","Hydration support","Dewy finish","K-beauty inspired care"]'::jsonb,
   '[]'::jsonb, '4-6 weeks', 'Complete kit program', 'Glass Kit',
   'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
   'Korean glass skincare kit', TRUE, TRUE, TRUE, FALSE, '["All India"]'::jsonb, NULL),
  ('basic-kit', 'Basic Kit', 'Basic Kit', 'home_kit', 'home-kit', 14000, '₹14,000', 'complete kit', 'Essential Skin Kit',
   'Essential skincare kit for regular care and beginner-level treatment support.',
   'Essential skincare kit for regular care and beginner-level treatment support.',
   '["Beginner friendly","Glow maintenance","Hydration and cleansing","All-skin support"]'::jsonb,
   '[]'::jsonb, '4-6 weeks', 'Complete kit program', 'Essential',
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
   'Basic skincare kit', TRUE, TRUE, FALSE, FALSE, '["All India"]'::jsonb, NULL),
  ('korean-glass-treatment', 'Korean Glass Treatment Campaign', 'Korean Glass Treatment Campaign', 'campaign', 'camp', 25000, '₹25,000', 'per session', 'Premium Clinical Glow Experience',
   'Campaign/location-based premium Korean glass treatment. Our team will contact you on WhatsApp with campaign date and location details.',
   'Campaign/location-based premium Korean glass treatment. Our team will contact you on WhatsApp with campaign date and location details.',
   '["Deep hydration glow","Glass skin finish","Skin texture refinement","Premium clinical care"]'::jsonb,
   '[]'::jsonb, '75-90 min', 'Event-based sessions', 'Premium',
   'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
   'Korean Glass Treatment Campaign', TRUE, TRUE, TRUE, TRUE, '["Mumbai","Delhi","Bangalore","Ahmedabad"]'::jsonb, NULL)
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
  process = EXCLUDED.process,
  duration = EXCLUDED.duration,
  sessions = EXCLUDED.sessions,
  badge = EXCLUDED.badge,
  image = EXCLUDED.image,
  image_alt = EXCLUDED.image_alt,
  active = TRUE,
  is_active = TRUE,
  featured = EXCLUDED.featured,
  requires_slots = EXCLUDED.requires_slots,
  available_cities = EXCLUDED.available_cities,
  deleted_at = NULL,
  updated_at = NOW();
