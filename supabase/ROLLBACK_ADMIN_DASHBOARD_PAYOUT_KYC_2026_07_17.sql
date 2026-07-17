-- Focused rollback for MIGRATION_ADMIN_DASHBOARD_PAYOUT_KYC_2026_07_17.sql
-- Preserves production data and uploaded files. It only removes new policies,
-- document metadata table, and the private bucket definition when empty.

DROP POLICY IF EXISTS "partner_kyc_private_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "partner_kyc_private_admin_read" ON storage.objects;
DROP POLICY IF EXISTS "partner_kyc_private_partner_read_own" ON storage.objects;
DROP POLICY IF EXISTS "partner_kyc_private_partner_upload_own" ON storage.objects;

DROP POLICY IF EXISTS "partner_kyc_documents_admin_all" ON public.partner_kyc_documents;
DROP POLICY IF EXISTS "partner_kyc_documents_partner_insert_own" ON public.partner_kyc_documents;
DROP POLICY IF EXISTS "partner_kyc_documents_partner_read_own" ON public.partner_kyc_documents;
DROP POLICY IF EXISTS "partner_kyc_admin_all" ON public.partner_kyc;
DROP POLICY IF EXISTS "partner_kyc_partner_update_own_open" ON public.partner_kyc;
DROP POLICY IF EXISTS "partner_kyc_partner_upsert_own" ON public.partner_kyc;
DROP POLICY IF EXISTS "partner_kyc_partner_read_own" ON public.partner_kyc;

-- Keep partner_kyc rows; only drop the additive document ledger if review chooses.
-- DROP TABLE IF EXISTS public.partner_kyc_documents;

DELETE FROM storage.buckets
WHERE id = 'partner-kyc-private'
  AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'partner-kyc-private');

SELECT 'rollback_admin_dashboard_payout_kyc_2026_07_17_complete' AS status;
