-- KIA Skin Care final handover readiness migration
-- Run this once in Supabase SQL editor before handover if these columns do not already exist.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS treatment_name TEXT,
  ADD COLUMN IF NOT EXISTS treatment_price NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS partner_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

COMMENT ON COLUMN bookings.payment_gateway IS 'Manual now. TODO: set to razorpay when Razorpay order creation is integrated.';
COMMENT ON COLUMN bookings.razorpay_order_id IS 'Future Razorpay order id.';
COMMENT ON COLUMN bookings.razorpay_payment_id IS 'Future Razorpay payment id.';

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(15, 2);

COMMENT ON COLUMN memberships.payment_gateway IS 'Manual now. TODO: set to razorpay when membership payment integration is added.';
COMMENT ON COLUMN memberships.razorpay_order_id IS 'Future Razorpay order id.';
COMMENT ON COLUMN memberships.razorpay_payment_id IS 'Future Razorpay payment id.';

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS deduction_rate NUMERIC(5, 4) DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS deduction_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS transaction_reference TEXT,
  ADD COLUMN IF NOT EXISTS transaction_note TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN payouts.gross_amount IS 'Partner gross withdrawal request before 15% deduction.';
COMMENT ON COLUMN payouts.deduction_amount IS '15% deduction withheld from partner payout.';
COMMENT ON COLUMN payouts.net_amount IS 'Actual net amount payable to partner.';

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS membership_price NUMERIC(15, 2) DEFAULT 1199,
  ADD COLUMN IF NOT EXISTS membership_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_points JSONB DEFAULT '[]'::jsonb;

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS key_name TEXT,
  ADD COLUMN IF NOT EXISTS value TEXT,
  ADD COLUMN IF NOT EXISTS value_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

UPDATE site_content
SET
  key_name = COALESCE(key_name, content_key),
  value = COALESCE(value, trim(both '"' from content_value::text))
WHERE key_name IS NULL OR value IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_code ON bookings(partner_code);
CREATE INDEX IF NOT EXISTS idx_payouts_partner_status ON payouts(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section, key_name);
