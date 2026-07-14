-- KIA Skin Care - Business Engine Commission Ledger Patch
-- Date: 2026-07-14
--
-- Review/apply order:
--   1. Apply only after PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql is present.
--   2. Run the verification queries at the bottom.
--   3. Do not run the rollback unless this patch itself must be removed.
--
-- Safety contract:
--   * No production rows are deleted.
--   * Existing Partner IDs, Membership IDs, Booking IDs, and Treatment Order IDs are untouched.
--   * Existing commission rows are not rewritten.
--   * Future booking commissions are generated from one idempotent database RPC.

BEGIN;

-- Final confirmed business model:
-- Level 1 = 6%, Level 2 = 3%, Level 3 = 1.7%, Level 4 = 1.2%.
-- Keep the existing settings table aligned so public/admin displays and backend math agree.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.commission_settings WHERE active = true) THEN
    UPDATE public.commission_settings
    SET
      level_1_percentage = 6,
      level_2_percentage = 3,
      level_3_percentage = 1.7,
      level_4_percentage = 1.2,
      updated_at = now()
    WHERE active = true;
  ELSE
    INSERT INTO public.commission_settings (
      level_1_percentage,
      level_2_percentage,
      level_3_percentage,
      level_4_percentage,
      active,
      created_at,
      updated_at
    )
    VALUES (6, 3, 1.7, 1.2, true, now(), now());
  END IF;
END$$;

-- One active commission row per booking/source, paid partner, and earning level.
-- The partial predicate preserves soft-delete behavior.
CREATE UNIQUE INDEX IF NOT EXISTS commissions_one_active_booking_level_per_partner
ON public.commissions (source_type, source_id, partner_id, level)
WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.kia_generate_booking_commissions(booking_uuid uuid)
RETURNS TABLE(
  id uuid,
  source_id uuid,
  partner_id uuid,
  level integer,
  percentage numeric,
  amount numeric,
  status public.commission_status,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row public.bookings%ROWTYPE;
  source_partner_id uuid;
  source_amount numeric;
  level_1_rate numeric := 6;
  level_2_rate numeric := 3;
  level_3_rate numeric := 1.7;
  level_4_rate numeric := 1.2;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND NOT public.kia_is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT *
  INTO booking_row
  FROM public.bookings
  WHERE id = booking_uuid
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF booking_row.payment_status::text <> 'paid'
     OR booking_row.booking_status::text NOT IN ('confirmed', 'completed') THEN
    RETURN;
  END IF;

  source_amount := COALESCE(
    booking_row.payment_amount,
    booking_row.final_amount,
    booking_row.treatment_price,
    0
  );

  IF source_amount <= 0 THEN
    RETURN;
  END IF;

  source_partner_id := booking_row.referred_by;

  IF source_partner_id IS NULL AND COALESCE(booking_row.referral_code, booking_row.partner_code) IS NOT NULL THEN
    SELECT p.id
    INTO source_partner_id
    FROM public.partners p
    WHERE upper(p.partner_code) = upper(COALESCE(booking_row.referral_code, booking_row.partner_code))
      AND p.status = 'active'::public.partner_status
      AND COALESCE(p.is_active, true) = true
      AND p.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF source_partner_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(cs.level_1_percentage, 6),
    COALESCE(cs.level_2_percentage, 3),
    COALESCE(cs.level_3_percentage, 1.7),
    COALESCE(cs.level_4_percentage, 1.2)
  INTO level_1_rate, level_2_rate, level_3_rate, level_4_rate
  FROM public.commission_settings cs
  WHERE cs.active = true
  ORDER BY cs.updated_at DESC NULLS LAST
  LIMIT 1;

  level_1_rate := COALESCE(level_1_rate, 6);
  level_2_rate := COALESCE(level_2_rate, 3);
  level_3_rate := COALESCE(level_3_rate, 1.7);
  level_4_rate := COALESCE(level_4_rate, 1.2);

  RETURN QUERY
  WITH RECURSIVE sponsor_chain(partner_id, earning_level, path) AS (
    SELECT
      p.sponsor_id,
      1,
      ARRAY[p.id]
    FROM public.partners p
    WHERE p.id = source_partner_id
      AND p.sponsor_id IS NOT NULL
      AND p.sponsor_id <> p.id

    UNION ALL

    SELECT
      parent.sponsor_id,
      sponsor_chain.earning_level + 1,
      sponsor_chain.path || sponsor_chain.partner_id
    FROM sponsor_chain
    JOIN public.partners parent ON parent.id = sponsor_chain.partner_id
    WHERE sponsor_chain.earning_level < 4
      AND parent.sponsor_id IS NOT NULL
      AND parent.sponsor_id <> ALL(sponsor_chain.path)
      AND parent.sponsor_id <> source_partner_id
  ),
  eligible_chain AS (
    SELECT DISTINCT ON (sponsor_chain.partner_id, sponsor_chain.earning_level)
      sponsor_chain.partner_id,
      sponsor_chain.earning_level,
      CASE sponsor_chain.earning_level
        WHEN 1 THEN level_1_rate
        WHEN 2 THEN level_2_rate
        WHEN 3 THEN level_3_rate
        WHEN 4 THEN level_4_rate
        ELSE 0
      END AS earning_percentage
    FROM sponsor_chain
    JOIN public.partners p ON p.id = sponsor_chain.partner_id
    WHERE sponsor_chain.partner_id IS NOT NULL
      AND sponsor_chain.earning_level BETWEEN 1 AND 4
      AND p.status = 'active'::public.partner_status
      AND COALESCE(p.is_active, true) = true
      AND p.deleted_at IS NULL
      AND (
        p.membership_expires_at IS NULL
        OR p.membership_expires_at >= now()
      )
    ORDER BY sponsor_chain.partner_id, sponsor_chain.earning_level
  )
  INSERT INTO public.commissions (
    partner_id,
    source_type,
    source_id,
    source_amount,
    level,
    percentage,
    amount,
    status,
    reversed,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    eligible_chain.partner_id,
    'booking'::public.source_type,
    booking_row.id,
    source_amount,
    eligible_chain.earning_level,
    eligible_chain.earning_percentage,
    ROUND(source_amount * eligible_chain.earning_percentage / 100, 2),
    'pending'::public.commission_status,
    false,
    true,
    now(),
    now()
  FROM eligible_chain
  WHERE eligible_chain.earning_percentage > 0
  ON CONFLICT (source_type, source_id, partner_id, level)
    WHERE deleted_at IS NULL
    DO NOTHING
  RETURNING
    commissions.id,
    commissions.source_id,
    commissions.partner_id,
    commissions.level,
    commissions.percentage,
    commissions.amount,
    commissions.status,
    commissions.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.kia_generate_booking_commissions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_generate_booking_commissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_generate_booking_commissions(uuid) TO service_role;

COMMIT;

-- Verification queries:
-- SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND proname = 'kia_generate_booking_commissions';
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'commissions_one_active_booking_level_per_partner';
-- SELECT level_1_percentage, level_2_percentage, level_3_percentage, level_4_percentage FROM public.commission_settings WHERE active = true ORDER BY updated_at DESC NULLS LAST LIMIT 1;
-- SELECT public.kia_generate_booking_commissions('<paid-confirmed-booking-uuid>'::uuid);
