CREATE TABLE IF NOT EXISTS franchise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  city TEXT NOT NULL,
  current_business TEXT,
  investment_budget TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_franchise_leads_created_at ON franchise_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_franchise_leads_status ON franchise_leads(status);

UPDATE treatments
SET
  title = 'Japanese Skin Care Kit',
  kit_name = 'Japanese Skin Care Kit',
  type = 'home_kit',
  treatment_type = 'home-kit',
  image_alt = 'Japanese Skin Care Kit',
  cta_text = 'Book Kit',
  updated_at = NOW()
WHERE title IN ('Japanese Skin Treatment', 'Japanese Skin Kit')
   OR kit_name IN ('Japanese Skin Treatment', 'Japanese Skin Kit')
   OR slug IN ('japanese-skin-treatment', 'Japanese-skin-');

UPDATE treatments
SET
  title = 'Basic Skin Care Kit',
  kit_name = 'Basic Skin Care Kit',
  type = 'home_kit',
  treatment_type = 'home-kit',
  image_alt = 'Basic Skin Care Kit',
  cta_text = 'Book Kit',
  updated_at = NOW()
WHERE title = 'Basic Skin Treatment'
   OR kit_name = 'Basic Skin Treatment'
   OR slug = 'basic-skin-treatment';

UPDATE treatments
SET
  title = 'Skin Lightening Kit',
  kit_name = 'Skin Lightening Kit',
  type = 'home_kit',
  treatment_type = 'home-kit',
  image_alt = 'Skin Lightening Kit',
  cta_text = 'Book Kit',
  updated_at = NOW()
WHERE title = 'Skin Lightening Treatment'
   OR kit_name = 'Skin Lightening Treatment'
   OR slug = 'skin-lightening';
