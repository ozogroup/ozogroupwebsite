-- ============================================================================
-- KIA Skin Care - Limited QA Cleanup
-- Date: 2026-07-10
-- ============================================================================
-- PURPOSE:
--   Removes clearly marked QA/test data after future test cycles.
--   This is safer than the full operational reset and only targets rows with
--   obvious QA markers.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE kia_qa_profiles AS
SELECT id
FROM public.profiles
WHERE lower(COALESCE(email, '')) LIKE '%kia.qa%'
   OR lower(COALESCE(email, '')) LIKE 'qa+%@%'
   OR lower(COALESCE(full_name, '')) LIKE '%kia qa%'
   OR lower(COALESCE(full_name, '')) LIKE '%test kia%';

CREATE TEMP TABLE kia_qa_partners AS
SELECT p.id, p.partner_code
FROM public.partners p
LEFT JOIN public.profiles pr ON pr.id = p.id
WHERE p.id IN (SELECT id FROM kia_qa_profiles)
   OR upper(COALESCE(p.partner_code, '')) LIKE 'KIAQA%'
   OR lower(COALESCE(pr.email, '')) LIKE '%kia.qa%'
   OR lower(COALESCE(pr.full_name, '')) LIKE '%kia qa%';

CREATE TEMP TABLE kia_qa_bookings AS
SELECT id
FROM public.bookings
WHERE lower(COALESCE(customer_email, '')) LIKE '%kia.qa%'
   OR lower(COALESCE(customer_email, '')) LIKE 'qa+%@%'
   OR lower(COALESCE(customer_name, '')) LIKE '%kia qa%'
   OR lower(COALESCE(customer_name, '')) LIKE '%test kia%'
   OR upper(COALESCE(partner_code, '')) IN (
      SELECT upper(COALESCE(partner_code, ''))
      FROM kia_qa_partners
      WHERE partner_code IS NOT NULL
   )
   OR referred_by IN (SELECT id FROM kia_qa_partners);

CREATE TEMP TABLE kia_qa_memberships AS
SELECT id
FROM public.memberships
WHERE lower(COALESCE(email, '')) LIKE '%kia.qa%'
   OR lower(COALESCE(email, '')) LIKE 'qa+%@%'
   OR lower(COALESCE(full_name, '')) LIKE '%kia qa%'
   OR lower(COALESCE(full_name, '')) LIKE '%test kia%'
   OR partner_id IN (SELECT id FROM kia_qa_partners)
   OR sponsor_id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.wallet_transactions
WHERE partner_id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.payouts
WHERE partner_id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.commissions
WHERE partner_id IN (SELECT id FROM kia_qa_partners)
   OR source_id IN (SELECT id FROM kia_qa_bookings)
   OR source_id IN (SELECT id FROM kia_qa_memberships);

DO $$
BEGIN
  IF to_regclass('public.earnings') IS NOT NULL THEN
    DELETE FROM public.earnings
    WHERE partner_id IN (SELECT id FROM kia_qa_partners);
  END IF;
END$$;

DELETE FROM public.referral_tree
WHERE ancestor_id IN (SELECT id FROM kia_qa_partners)
   OR descendant_id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.referral_links
WHERE partner_id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.referral_clicks
WHERE partner_id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.bookings
WHERE id IN (SELECT id FROM kia_qa_bookings);

DELETE FROM public.memberships
WHERE id IN (SELECT id FROM kia_qa_memberships);

DO $$
BEGIN
  IF to_regclass('public.partner_sales') IS NOT NULL THEN
    DELETE FROM public.partner_sales
    WHERE partner_id IN (SELECT id FROM kia_qa_partners);
  END IF;

  IF to_regclass('public.partner_kyc') IS NOT NULL THEN
    DELETE FROM public.partner_kyc
    WHERE partner_id IN (SELECT id FROM kia_qa_partners);
  END IF;
END$$;

DELETE FROM public.partners
WHERE id IN (SELECT id FROM kia_qa_partners);

DELETE FROM public.profiles
WHERE id IN (SELECT id FROM kia_qa_profiles)
  AND COALESCE(role::text, '') NOT IN ('super_admin', 'admin');

COMMIT;

-- Supabase Auth users matching these QA emails must be removed separately
-- through server-side Admin API tooling if a complete auth cleanup is required.
