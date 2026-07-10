-- ============================================================================
-- KIA Skin Care - Treatment Images and Booking Price Snapshot
-- Date: 2026-07-10
-- ============================================================================
-- SAFETY CONTRACT:
--   * Additive and idempotent.
--   * Preserves existing treatment image/gallery values.
--   * Does not delete storage assets.
--   * Does not integrate Razorpay.
-- ============================================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

CREATE TABLE IF NOT EXISTS public.treatment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  storage_path TEXT,
  public_url TEXT,
  image_url TEXT,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.treatment_images ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.treatment_images
SET public_url = COALESCE(public_url, image_url)
WHERE public_url IS NULL AND image_url IS NOT NULL;

UPDATE public.treatment_images
SET image_url = COALESCE(image_url, public_url)
WHERE image_url IS NULL AND public_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treatment_images_treatment_order
  ON public.treatment_images(treatment_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_treatment_images_primary
  ON public.treatment_images(treatment_id, is_primary);

-- Migrate legacy treatments.image and treatments.gallery into treatment_images.
DO $$
DECLARE
  treatment_row record;
  gallery_image_url text;
  image_index integer;
BEGIN
  FOR treatment_row IN SELECT id, title, image, image_alt, gallery FROM public.treatments
  LOOP
    image_index := 0;

    IF treatment_row.image IS NOT NULL AND trim(treatment_row.image) <> '' THEN
      INSERT INTO public.treatment_images (
        treatment_id,
        public_url,
        image_url,
        alt_text,
        is_primary,
        sort_order
      )
      SELECT
        treatment_row.id,
        treatment_row.image,
        treatment_row.image,
        COALESCE(treatment_row.image_alt, treatment_row.title),
        TRUE,
        0
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.treatment_images existing
        WHERE existing.treatment_id = treatment_row.id
          AND COALESCE(existing.public_url, existing.image_url) = treatment_row.image
      );
      image_index := 1;
    END IF;

    IF jsonb_typeof(to_jsonb(treatment_row.gallery)) = 'array' THEN
      FOR gallery_image_url IN
        SELECT jsonb_array_elements_text(to_jsonb(treatment_row.gallery))
      LOOP
        IF gallery_image_url IS NOT NULL AND trim(gallery_image_url) <> '' THEN
          INSERT INTO public.treatment_images (
            treatment_id,
            public_url,
            image_url,
            alt_text,
            is_primary,
            sort_order
          )
          SELECT
            treatment_row.id,
            gallery_image_url,
            gallery_image_url,
            COALESCE(treatment_row.image_alt, treatment_row.title),
            treatment_row.image IS NULL AND image_index = 0,
            image_index
          WHERE NOT EXISTS (
            SELECT 1
            FROM public.treatment_images existing
            WHERE existing.treatment_id = treatment_row.id
              AND COALESCE(existing.public_url, existing.image_url) = gallery_image_url
          );
          image_index := image_index + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END$$;

-- Ensure every treatment that has images has exactly one primary.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY treatment_id
      ORDER BY is_primary DESC, sort_order ASC, created_at ASC
    ) AS rn
  FROM public.treatment_images
)
UPDATE public.treatment_images ti
SET is_primary = ranked.rn = 1,
    updated_at = NOW()
FROM ranked
WHERE ti.id = ranked.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_treatment_images_single_primary
  ON public.treatment_images(treatment_id)
  WHERE is_primary = TRUE;

-- Keep treatment master image/gallery in sync for legacy readers.
WITH image_rollup AS (
  SELECT
    treatment_id,
    (ARRAY_AGG(COALESCE(public_url, image_url) ORDER BY is_primary DESC, sort_order ASC, created_at ASC))[1] AS primary_url,
    ARRAY_AGG(COALESCE(public_url, image_url) ORDER BY is_primary DESC, sort_order ASC, created_at ASC) AS gallery_urls
  FROM public.treatment_images
  WHERE COALESCE(public_url, image_url) IS NOT NULL
  GROUP BY treatment_id
)
UPDATE public.treatments t
SET image = image_rollup.primary_url,
    gallery = to_jsonb(image_rollup.gallery_urls),
    updated_at = NOW()
FROM image_rollup
WHERE t.id = image_rollup.treatment_id;

-- Booking price snapshot fields. Existing bookings keep their original values.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS treatment_name_snapshot TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS unit_price_snapshot NUMERIC(12, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_snapshot NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS final_amount NUMERIC(12, 2);

UPDATE public.bookings
SET treatment_name_snapshot = COALESCE(treatment_name_snapshot, treatment_name),
    unit_price_snapshot = COALESCE(unit_price_snapshot, treatment_price, payment_amount),
    discount_snapshot = COALESCE(discount_snapshot, 0),
    final_amount = COALESCE(final_amount, payment_amount, treatment_price)
WHERE treatment_name_snapshot IS NULL
   OR unit_price_snapshot IS NULL
   OR final_amount IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_treatment_snapshot
  ON public.bookings(treatment_id, created_at DESC);

-- Public reads for active treatment images. Admin writes continue through
-- authenticated admin policies or server-side service-role actions.
ALTER TABLE public.treatment_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_treatment_images ON public.treatment_images;
CREATE POLICY public_read_treatment_images
ON public.treatment_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.treatments t
    WHERE t.id = treatment_images.treatment_id
      AND t.active = TRUE
      AND t.deleted_at IS NULL
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'media_public_read'
  ) THEN
    CREATE POLICY media_public_read
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'media_admin_insert'
  ) THEN
    CREATE POLICY media_admin_insert
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'media'
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('super_admin', 'admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'media_admin_update'
  ) THEN
    CREATE POLICY media_admin_update
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'media'
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('super_admin', 'admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'media_admin_delete'
  ) THEN
    CREATE POLICY media_admin_delete
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'media'
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('super_admin', 'admin')
      )
    );
  END IF;
END$$;

COMMIT;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
