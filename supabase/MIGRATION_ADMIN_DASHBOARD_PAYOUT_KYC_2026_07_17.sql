-- KIA Skin Care - Admin dashboard, payout export/settlement, and KYC hardening
-- Date: 2026-07-17
-- Safe intent: additive/idempotent. Does not delete production rows, reset Auth,
-- regenerate Partner IDs, or rewrite referral relationships.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF to_regclass('public._kia_dash_payout_kyc_backup_20260717_partners') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_dash_payout_kyc_backup_20260717_partners AS TABLE public.partners WITH DATA';
  END IF;
  IF to_regclass('public.partner_kyc') IS NOT NULL
     AND to_regclass('public._kia_dash_payout_kyc_backup_20260717_partner_kyc') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_dash_payout_kyc_backup_20260717_partner_kyc AS TABLE public.partner_kyc WITH DATA';
  END IF;
  IF to_regclass('public._kia_dash_payout_kyc_backup_20260717_payouts') IS NULL THEN
    EXECUTE 'CREATE TABLE public._kia_dash_payout_kyc_backup_20260717_payouts AS TABLE public.payouts WITH DATA';
  END IF;
END $$;

ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'resubmission_required';
ALTER TYPE public.kyc_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.payout_status ADD VALUE IF NOT EXISTS 'approved';

CREATE TABLE IF NOT EXISTS public.partner_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID UNIQUE NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  account_holder_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  bank_ifsc TEXT,
  branch_name TEXT,
  upi_id TEXT,
  pan_card_path TEXT,
  aadhaar_front_path TEXT,
  aadhaar_back_path TEXT,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_kyc
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('bank','upi')),
  ADD COLUMN IF NOT EXISTS registered_mobile TEXT,
  ADD COLUMN IF NOT EXISTS account_last4 TEXT,
  ADD COLUMN IF NOT EXISTS upi_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS upi_mobile TEXT,
  ADD COLUMN IF NOT EXISTS upi_app TEXT,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resubmission_reason TEXT,
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch_name TEXT;

CREATE TABLE IF NOT EXISTS public.partner_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  kyc_id UUID REFERENCES public.partner_kyc(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar_front','aadhaar_back','pan_card','selfie','cancelled_cheque')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'submitted',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  UNIQUE (partner_id, document_type, version)
);

CREATE INDEX IF NOT EXISTS idx_partner_kyc_partner_status ON public.partner_kyc(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_kyc_payment_method ON public.partner_kyc(payment_method);
CREATE INDEX IF NOT EXISTS idx_partner_kyc_documents_partner ON public.partner_kyc_documents(partner_id, document_type);
CREATE INDEX IF NOT EXISTS idx_partners_kyc_status_live ON public.partners(kyc_status, status);
CREATE INDEX IF NOT EXISTS idx_payouts_status_paid ON public.payouts(status, paid_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-kyc-private',
  'partner-kyc-private',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.partner_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_kyc_partner_read_own" ON public.partner_kyc;
CREATE POLICY "partner_kyc_partner_read_own"
ON public.partner_kyc FOR SELECT
USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_kyc_partner_upsert_own" ON public.partner_kyc;
CREATE POLICY "partner_kyc_partner_upsert_own"
ON public.partner_kyc FOR INSERT
WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_kyc_partner_update_own_open" ON public.partner_kyc;
CREATE POLICY "partner_kyc_partner_update_own_open"
ON public.partner_kyc FOR UPDATE
USING (auth.uid() = partner_id AND status::text IN ('not_submitted','pending','rejected','resubmission_required'));

DROP POLICY IF EXISTS "partner_kyc_admin_all" ON public.partner_kyc;
CREATE POLICY "partner_kyc_admin_all"
ON public.partner_kyc FOR ALL
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "partner_kyc_documents_partner_read_own" ON public.partner_kyc_documents;
CREATE POLICY "partner_kyc_documents_partner_read_own"
ON public.partner_kyc_documents FOR SELECT
USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_kyc_documents_partner_insert_own" ON public.partner_kyc_documents;
CREATE POLICY "partner_kyc_documents_partner_insert_own"
ON public.partner_kyc_documents FOR INSERT
WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_kyc_documents_admin_all" ON public.partner_kyc_documents;
CREATE POLICY "partner_kyc_documents_admin_all"
ON public.partner_kyc_documents FOR ALL
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "partner_kyc_private_partner_upload_own" ON storage.objects;
CREATE POLICY "partner_kyc_private_partner_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-kyc-private'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'partners'
);

DROP POLICY IF EXISTS "partner_kyc_private_partner_read_own" ON storage.objects;
CREATE POLICY "partner_kyc_private_partner_read_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-kyc-private'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (storage.foldername(name))[1] = 'partners'
);

DROP POLICY IF EXISTS "partner_kyc_private_admin_read" ON storage.objects;
CREATE POLICY "partner_kyc_private_admin_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-kyc-private' AND public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "partner_kyc_private_admin_write" ON storage.objects;
CREATE POLICY "partner_kyc_private_admin_write"
ON storage.objects FOR ALL
USING (bucket_id = 'partner-kyc-private' AND public.kia_is_admin(auth.uid()))
WITH CHECK (bucket_id = 'partner-kyc-private' AND public.kia_is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.process_partner_payout(
  payout_id_input UUID,
  new_status_input TEXT,
  transaction_reference_input TEXT DEFAULT NULL,
  transaction_note_input TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout_row public.payouts%ROWTYPE;
  partner_row public.partners%ROWTYPE;
  previous_status public.payout_status;
  gross_debit NUMERIC(15,2);
  new_balance NUMERIC(15,2);
BEGIN
  IF new_status_input NOT IN ('requested', 'approved', 'processing', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported payout status: %', new_status_input;
  END IF;

  SELECT * INTO payout_row FROM public.payouts WHERE id = payout_id_input FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;
  previous_status := payout_row.status;

  IF payout_row.status = 'paid' THEN
    RETURN to_jsonb(payout_row);
  END IF;

  IF new_status_input = 'paid' THEN
    IF COALESCE(transaction_reference_input, '') = '' THEN
      RAISE EXCEPTION 'Transaction reference is required';
    END IF;
    IF payout_row.status NOT IN ('approved', 'processing') THEN
      RAISE EXCEPTION 'Payout must be approved or processing before paid settlement';
    END IF;

    SELECT * INTO partner_row FROM public.partners WHERE id = payout_row.partner_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Partner not found'; END IF;

    gross_debit := COALESCE(payout_row.gross_amount, payout_row.available_balance, payout_row.amount, 0);
    IF gross_debit <= 0 THEN RAISE EXCEPTION 'Invalid payout amount'; END IF;

    new_balance := 0;
    UPDATE public.partners
    SET wallet_balance = 0,
        paid_earnings = COALESCE(paid_earnings, 0) + COALESCE(payout_row.net_amount, payout_row.amount, 0),
        updated_at = NOW()
    WHERE id = payout_row.partner_id;

    INSERT INTO public.wallet_transactions (
      partner_id, transaction_type, amount, balance_before, balance_after,
      reference_type, reference_id, notes
    ) VALUES (
      payout_row.partner_id, 'payout_debit', COALESCE(partner_row.wallet_balance, 0),
      partner_row.wallet_balance, 0, 'payout', payout_row.id,
      COALESCE(transaction_note_input, 'Payout marked paid by admin')
    );
  END IF;

  UPDATE public.payouts
  SET status = new_status_input::public.payout_status,
      transaction_reference = COALESCE(transaction_reference_input, transaction_reference),
      transaction_note = COALESCE(transaction_note_input, transaction_note),
      approved_at = CASE WHEN new_status_input IN ('approved','processing') THEN NOW() ELSE approved_at END,
      rejected_at = CASE WHEN new_status_input = 'rejected' THEN NOW() ELSE rejected_at END,
      paid_at = CASE WHEN new_status_input = 'paid' THEN NOW() ELSE paid_at END,
      processed_at = CASE WHEN new_status_input = 'paid' THEN NOW() ELSE processed_at END,
      updated_at = NOW()
  WHERE id = payout_id_input
  RETURNING * INTO payout_row;

  INSERT INTO public.activity_logs (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(), 'admin', 'payout_status_changed', 'payout', payout_row.id,
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', new_status_input, 'transaction_reference', transaction_reference_input)
  );

  RETURN to_jsonb(payout_row);
END;
$$;

REVOKE ALL ON FUNCTION public.process_partner_payout(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_partner_payout(UUID, TEXT, TEXT, TEXT) TO service_role;

SELECT 'migration_admin_dashboard_payout_kyc_2026_07_17_ready' AS status;
