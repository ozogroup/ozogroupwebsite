-- KIA Skin Care - client treatment poster image update
-- Run this in Supabase SQL Editor after deploying the code.
-- Additive/idempotent: updates only image fields for the five existing treatment slugs.

ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS image_alt TEXT;

UPDATE public.treatments
SET
  image = '/images/treatments/client-posters/korean-glass-treatment.png',
  image_url = '/images/treatments/client-posters/korean-glass-treatment.png',
  gallery = '["/images/treatments/client-posters/korean-glass-treatment.png"]'::jsonb,
  image_alt = 'Korean Glass Treatment poster',
  updated_at = NOW()
WHERE slug IN ('korean-glass-skin', 'korean-glass-treatment');

UPDATE public.treatments
SET
  image = '/images/treatments/client-posters/basic-skin-care-kit.png',
  image_url = '/images/treatments/client-posters/basic-skin-care-kit.png',
  gallery = '["/images/treatments/client-posters/basic-skin-care-kit.png"]'::jsonb,
  image_alt = 'Basic Skin Care Kit poster',
  updated_at = NOW()
WHERE slug IN ('basic-skin-treatment', 'basic-kit');

UPDATE public.treatments
SET
  image = '/images/treatments/client-posters/skin-lightening-kit.png',
  image_url = '/images/treatments/client-posters/skin-lightening-kit.png',
  gallery = '["/images/treatments/client-posters/skin-lightening-kit.png"]'::jsonb,
  image_alt = 'Skin Lightening Kit poster',
  updated_at = NOW()
WHERE slug = 'skin-lightening';

UPDATE public.treatments
SET
  image = '/images/treatments/client-posters/advanced-skin-care-kit.png',
  image_url = '/images/treatments/client-posters/advanced-skin-care-kit.png',
  gallery = '["/images/treatments/client-posters/advanced-skin-care-kit.png"]'::jsonb,
  image_alt = 'Advanced Skin Care Kit poster',
  updated_at = NOW()
WHERE slug IN ('advanced-skin-treatment', 'advance-kit');

UPDATE public.treatments
SET
  image = '/images/treatments/client-posters/japanese-skin-care-kit.png',
  image_url = '/images/treatments/client-posters/japanese-skin-care-kit.png',
  gallery = '["/images/treatments/client-posters/japanese-skin-care-kit.png"]'::jsonb,
  image_alt = 'Japanese Skin Care Kit poster',
  updated_at = NOW()
WHERE slug IN ('japanese-skin-treatment', 'japanese-kit');
