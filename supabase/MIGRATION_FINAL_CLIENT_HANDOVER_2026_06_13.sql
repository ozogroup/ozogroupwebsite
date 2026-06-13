-- KIA Skin Care final client handover migration
-- Date: 2026-06-13
-- Safe to run repeatedly in the Supabase SQL editor.

ALTER TABLE treatments
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url TEXT;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'unpaid';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';

CREATE INDEX IF NOT EXISTS idx_bookings_created_status
  ON bookings(created_at DESC, booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_created
  ON bookings(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_unviewed
  ON bookings(created_at DESC) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_referral_code
  ON bookings(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partners_sponsor_status
  ON partners(sponsor_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_tree_ancestor_level
  ON referral_tree(ancestor_id, level);
CREATE INDEX IF NOT EXISTS idx_referral_tree_descendant_level
  ON referral_tree(descendant_id, level);
CREATE INDEX IF NOT EXISTS idx_commissions_partner_created
  ON commissions(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status_created
  ON payouts(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_commission_level
  ON commissions(source_id, partner_id, level)
  WHERE source_type = 'booking' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_open_payout
  ON payouts(partner_id)
  WHERE status IN ('requested', 'processing') AND deleted_at IS NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  TRUE,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

UPDATE treatments
SET
  image = '/images/client-approved/japanese-skin-care-kit.jpeg',
  image_url = '/images/client-approved/japanese-skin-care-kit.jpeg',
  gallery = '["/images/client-approved/japanese-skin-care-kit.jpeg"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'japanese-skin-treatment';

UPDATE treatments
SET
  image = '/images/client-approved/korean-glass-treatment-kit.jpeg',
  image_url = '/images/client-approved/korean-glass-treatment-kit.jpeg',
  gallery = '["/images/client-approved/korean-glass-treatment-kit.jpeg"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'korean-glass-skin';

UPDATE treatments
SET
  image = '/images/client-approved/skin-lightening-kit.jpeg',
  image_url = '/images/client-approved/skin-lightening-kit.jpeg',
  gallery = '["/images/client-approved/skin-lightening-kit.jpeg"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'skin-lightening';

INSERT INTO site_content (page, section, content_key, key_name, value, value_type, is_active, display_order)
SELECT 'home', 'home_hero', 'hero_image', 'hero_image',
       '/images/client-approved/korean-glass-treatment-kit.jpeg', 'image_url', TRUE, 6
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section = 'home_hero' AND COALESCE(content_key, key_name) = 'hero_image'
);

INSERT INTO site_content (page, section, content_key, key_name, value, value_type, is_active, display_order)
SELECT 'home', 'franchise', 'franchise_image', 'franchise_image',
       '/images/client-approved/franchise-income-model.jpeg', 'image_url', TRUE, 1
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section = 'franchise' AND COALESCE(content_key, key_name) = 'franchise_image'
);

INSERT INTO site_content (page, section, content_key, key_name, value, value_type, is_active, display_order)
SELECT 'referral', 'partner_program', 'partner_image', 'partner_image',
       '/images/client-approved/franchise-opportunity.jpeg', 'image_url', TRUE, 1
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section = 'partner_program' AND COALESCE(content_key, key_name) = 'partner_image'
);

CREATE OR REPLACE FUNCTION process_partner_payout(
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
  payout_row payouts%ROWTYPE;
  partner_row partners%ROWTYPE;
  previous_status payout_status;
  gross_debit NUMERIC(15,2);
  new_balance NUMERIC(15,2);
BEGIN
  IF new_status_input NOT IN ('requested', 'processing', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported payout status: %', new_status_input;
  END IF;

  SELECT * INTO payout_row FROM payouts WHERE id = payout_id_input FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;
  previous_status := payout_row.status;
  IF payout_row.status = 'paid' AND new_status_input = 'paid' THEN
    RETURN to_jsonb(payout_row);
  END IF;

  IF new_status_input = 'paid' THEN
    SELECT * INTO partner_row FROM partners WHERE id = payout_row.partner_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Partner not found'; END IF;

    gross_debit := COALESCE(payout_row.gross_amount, payout_row.available_balance, payout_row.amount, 0);
    IF gross_debit <= 0 THEN RAISE EXCEPTION 'Invalid payout amount'; END IF;
    IF COALESCE(partner_row.wallet_balance, 0) < gross_debit THEN
      RAISE EXCEPTION 'Partner wallet balance is lower than payout amount';
    END IF;

    new_balance := COALESCE(partner_row.wallet_balance, 0) - gross_debit;
    UPDATE partners
    SET
      wallet_balance = new_balance,
      paid_earnings = COALESCE(paid_earnings, 0) + COALESCE(payout_row.net_amount, payout_row.amount, 0),
      updated_at = NOW()
    WHERE id = payout_row.partner_id;

    INSERT INTO wallet_transactions (
      partner_id, transaction_type, amount, balance_before, balance_after,
      reference_type, reference_id, notes
    ) VALUES (
      payout_row.partner_id, 'payout_debit', gross_debit,
      partner_row.wallet_balance, new_balance, 'payout', payout_row.id,
      COALESCE(transaction_note_input, 'Payout marked paid by admin')
    );
  END IF;

  UPDATE payouts
  SET
    status = new_status_input::payout_status,
    transaction_reference = COALESCE(transaction_reference_input, transaction_reference),
    transaction_note = COALESCE(transaction_note_input, transaction_note),
    approved_at = CASE WHEN new_status_input = 'processing' THEN NOW() ELSE approved_at END,
    rejected_at = CASE WHEN new_status_input = 'rejected' THEN NOW() ELSE rejected_at END,
    paid_at = CASE WHEN new_status_input = 'paid' THEN NOW() ELSE paid_at END,
    processed_at = CASE WHEN new_status_input = 'paid' THEN NOW() ELSE processed_at END,
    updated_at = NOW()
  WHERE id = payout_id_input
  RETURNING * INTO payout_row;

  INSERT INTO activity_logs (
    actor_id, actor_role, action, entity_type, entity_id, old_value, new_value
  ) VALUES (
    auth.uid(), 'admin', 'payout_status_changed', 'payout', payout_row.id,
    jsonb_build_object('status', previous_status),
    jsonb_build_object(
      'status', new_status_input,
      'transaction_reference', transaction_reference_input,
      'transaction_note', transaction_note_input
    )
  );

  RETURN to_jsonb(payout_row);
END;
$$;

REVOKE ALL ON FUNCTION process_partner_payout(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_partner_payout(UUID, TEXT, TEXT, TEXT) TO service_role;

-- Public clients must not be able to bypass server validation by writing directly.
DROP POLICY IF EXISTS "bookings_server_action_create" ON bookings;
DROP POLICY IF EXISTS "memberships_server_action_create" ON memberships;
DROP POLICY IF EXISTS "referral_clicks_server_action_create" ON referral_clicks;
DROP POLICY IF EXISTS "wallet_transactions_server_action_create" ON wallet_transactions;
DROP POLICY IF EXISTS "payments_server_action_create" ON payments;
DROP POLICY IF EXISTS "webhook_logs_server_action_create" ON webhook_logs;
DROP POLICY IF EXISTS "daily_partner_stats_server_action_create" ON daily_partner_stats;
DROP POLICY IF EXISTS "otp_logs_server_action_create" ON otp_logs;
DROP POLICY IF EXISTS "notifications_server_action_create" ON notifications;
