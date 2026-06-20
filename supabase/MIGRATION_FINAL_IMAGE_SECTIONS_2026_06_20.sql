-- KIA Skin Care final image-section migration.
-- Replaces fixed treatment-benefit poster slots with one ordered gallery.

DELETE FROM site_content
WHERE section = 'treatment_benefits'
  AND COALESCE(content_key, key_name) IN (
    'poster_image_1',
    'poster_image_2',
    'poster_image_3',
    'poster_image_4'
  );

INSERT INTO site_content (
  page,
  section,
  content_key,
  key_name,
  value,
  value_type,
  is_active,
  display_order
)
VALUES (
  'home',
  'treatment_benefits',
  'benefit_images',
  'benefit_images',
  '["/images/treatment-benefits/01-premium-skincare-franchise.jpeg","/images/treatment-benefits/02-japanese-treatment-kit.jpeg","/images/treatment-benefits/03-korean-lightening-treatment-kit.jpeg","/images/treatment-benefits/04-franchise-opportunity.jpeg","/images/treatment-benefits/05-korean-glass-treatment-kit.jpeg"]',
  'image_gallery',
  TRUE,
  4
)
ON CONFLICT (section, key_name) DO UPDATE SET
  page = EXCLUDED.page,
  content_key = EXCLUDED.content_key,
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  is_active = TRUE,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

UPDATE site_content
SET value = '/images/client-approved/franchise-banner-final.png',
    value_type = 'image_url',
    updated_at = NOW()
WHERE section = 'franchise'
  AND COALESCE(content_key, key_name) = 'franchise_image'
  AND (
    value IS NULL
    OR value = ''
    OR value IN (
      '/images/client-approved/franchise-banner.png',
      '/images/client-approved/franchise-income-model.jpeg',
      '/images/client-approved/franchise-monthly-income.jpeg',
      '/images/client-approved/franchise-opportunity.jpeg',
      '/images/client-approved/professional-product-kit-pricing.png'
    )
  );

UPDATE site_content
SET value = '/images/client-approved/home-hero-korean-skincare.png',
    value_type = 'image_url',
    updated_at = NOW()
WHERE section = 'about'
  AND COALESCE(content_key, key_name) = 'about_image'
  AND value IN (
    '/images/client-approved/franchise-income-model.jpeg',
    '/images/client-approved/franchise-monthly-income.jpeg',
    '/images/client-approved/franchise-opportunity.jpeg'
  );
