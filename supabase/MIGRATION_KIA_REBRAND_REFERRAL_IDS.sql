-- KIA Skin Care - legacy brand cleanup and referral ID prefix migration
-- Relations remain anchored to partner UUIDs; only display/tracking code text changes.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM partners legacy
    JOIN partners current
      ON upper(current.partner_code) =
         'KIA' || substring(upper(legacy.partner_code) FROM 4)
    WHERE legacy.partner_code ~* '^OZO[0-9]+$'
      AND current.id <> legacy.id
  ) THEN
    RAISE EXCEPTION 'Cannot migrate referral IDs: matching KIA partner codes already exist.';
  END IF;
END $$;

UPDATE partners
SET
  partner_code = regexp_replace(partner_code, '^OZO', 'KIA', 'i'),
  referral_link = regexp_replace(referral_link, '([?&]ref=)OZO([0-9]+)', '\1KIA\2', 'gi')
WHERE partner_code ~* '^OZO[0-9]+$'
   OR referral_link ~* '([?&]ref=)OZO[0-9]+';

UPDATE memberships
SET referral_code = regexp_replace(referral_code, '^OZO', 'KIA', 'i')
WHERE referral_code ~* '^OZO[0-9]+$';

UPDATE bookings
SET referral_code = regexp_replace(referral_code, '^OZO', 'KIA', 'i')
WHERE referral_code ~* '^OZO[0-9]+$';

UPDATE referral_clicks
SET referral_code = regexp_replace(referral_code, '^OZO', 'KIA', 'i')
WHERE referral_code ~* '^OZO[0-9]+$';

UPDATE referral_links
SET
  partner_code = regexp_replace(partner_code, '^OZO', 'KIA', 'i'),
  referral_link = regexp_replace(referral_link, '([?&]ref=)OZO([0-9]+)', '\1KIA\2', 'gi')
WHERE partner_code ~* '^OZO[0-9]+$'
   OR referral_link ~* '([?&]ref=)OZO[0-9]+';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'partner_code'
  ) THEN
    UPDATE bookings
    SET partner_code = regexp_replace(partner_code, '^OZO', 'KIA', 'i')
    WHERE partner_code ~* '^OZO[0-9]+$';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_sales'
      AND column_name = 'partner_code'
  ) THEN
    UPDATE partner_sales
    SET partner_code = regexp_replace(partner_code, '^OZO', 'KIA', 'i')
    WHERE partner_code ~* '^OZO[0-9]+$';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.kia_brand_text(source_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(source_text, 'OZO[[:space:]]*/[[:space:]]*IA Skin Care', 'KIA Skin Care', 'gi'),
          'OZO Services?', 'KIA Skin Care', 'gi'
        ),
        'OZO Group', 'KIA Skin Care', 'gi'
      ),
      '\mIA Skin Care\M', 'KIA Skin Care', 'gi'
    ),
    '\mOZO\M', 'KIA Skin Care', 'gi'
  );
$$;

UPDATE site_content
SET value = pg_temp.kia_brand_text(
  regexp_replace(value, '\mKKIA Skin Care\M', 'KIA Skin Care', 'gi')
)
WHERE value ~* '\mKKIA Skin Care\M|\mOZO\M|\mIA Skin Care\M';

UPDATE testimonials
SET quote = pg_temp.kia_brand_text(
  regexp_replace(quote, '\mKKIA Skin Care\M', 'KIA Skin Care', 'gi')
)
WHERE quote ~* '\mKKIA Skin Care\M|\mOZO\M|\mIA Skin Care\M';

UPDATE faqs
SET
  question = pg_temp.kia_brand_text(
    regexp_replace(question, '\mKKIA Skin Care\M', 'KIA Skin Care', 'gi')
  ),
  answer = pg_temp.kia_brand_text(
    regexp_replace(answer, '\mKKIA Skin Care\M', 'KIA Skin Care', 'gi')
  )
WHERE question ~* '\mKKIA Skin Care\M|\mOZO\M|\mIA Skin Care\M'
   OR answer ~* '\mKKIA Skin Care\M|\mOZO\M|\mIA Skin Care\M';

UPDATE contact_settings
SET
  email = CASE
    WHEN lower(email) IN ('contact@ozo.com', 'contact@ia-skincare.com')
      THEN ''
    ELSE email
  END,
  address = pg_temp.kia_brand_text(
    regexp_replace(address, '\mKKIA Skin Care\M', 'KIA Skin Care', 'gi')
  ),
  whatsapp = replace(replace(whatsapp, 'IA%20Skin%20Care', 'KIA%20Skin%20Care'), 'OZO%20Service', 'KIA%20Skin%20Care'),
  facebook_url = replace(facebook_url, 'facebook.com/ia-skincare', 'facebook.com/kia-skincare'),
  instagram_url = replace(instagram_url, 'instagram.com/ia-skincare', 'instagram.com/kia-skincare')
WHERE email ~* 'contact@(ozo|ia-skincare)\.com'
   OR address ~* '\mKKIA Skin Care\M|\mOZO\M|\mIA Skin Care\M'
   OR whatsapp ~* 'OZO|IA%20Skin%20Care'
   OR facebook_url ~* 'facebook\.com/ia-skincare'
   OR instagram_url ~* 'instagram\.com/ia-skincare';

COMMIT;
