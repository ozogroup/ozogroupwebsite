-- KIA Skin Care official social and support contact details.
UPDATE contact_settings
SET
  email = 'supportkiaskincare@gmail.com',
  facebook_url = 'https://www.facebook.com/profile.php?id=61591206116153&mibextid=ZbWKwL',
  instagram_url = 'https://www.instagram.com/kiaskincareindia?igsh=MTl2c2h4cnh0dHBjOQ==',
  updated_at = NOW();

UPDATE site_content
SET value = 'supportkiaskincare@gmail.com', updated_at = NOW()
WHERE section = 'contact' AND COALESCE(content_key, key_name) = 'email';

UPDATE site_content
SET value = 'https://www.facebook.com/profile.php?id=61591206116153&mibextid=ZbWKwL', updated_at = NOW()
WHERE section = 'contact' AND COALESCE(content_key, key_name) = 'facebook';

UPDATE site_content
SET value = 'https://www.instagram.com/kiaskincareindia?igsh=MTl2c2h4cnh0dHBjOQ==', updated_at = NOW()
WHERE section = 'contact' AND COALESCE(content_key, key_name) = 'instagram';
