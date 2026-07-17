SELECT 'partner_kyc table' AS check_name, to_regclass('public.partner_kyc') IS NOT NULL AS ok;
SELECT 'partner_kyc_documents table' AS check_name, to_regclass('public.partner_kyc_documents') IS NOT NULL AS ok;
SELECT 'private bucket' AS check_name, EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'partner-kyc-private' AND public = FALSE) AS ok;
SELECT 'approved payout enum' AS check_name, EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'payout_status' AND e.enumlabel = 'approved') AS ok;
SELECT 'under review kyc enum' AS check_name, EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'kyc_status' AND e.enumlabel = 'under_review') AS ok;
SELECT 'process_partner_payout exists' AS check_name, to_regprocedure('public.process_partner_payout(uuid,text,text,text)') IS NOT NULL AS ok;
SELECT 'partner_kyc policies' AS check_name, COUNT(*) AS policy_count FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('partner_kyc','partner_kyc_documents');
SELECT 'storage policies' AS check_name, COUNT(*) AS policy_count FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'partner_kyc_private_%';
