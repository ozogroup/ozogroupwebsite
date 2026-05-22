-- Remove scheduling fields from public treatment booking flow.
-- Run once in production after deploying the matching application code.

ALTER TABLE bookings DROP COLUMN IF EXISTS preferred_date;
ALTER TABLE bookings DROP COLUMN IF EXISTS preferred_time;

CREATE INDEX IF NOT EXISTS idx_bookings_partner_code ON bookings(partner_code);
CREATE INDEX IF NOT EXISTS idx_bookings_referral_code ON bookings(referral_code);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_sales_partner ON partner_sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_code ON partner_sales(partner_code);
CREATE INDEX IF NOT EXISTS idx_partner_sales_booking_status ON partner_sales(booking_status);
CREATE INDEX IF NOT EXISTS idx_partner_sales_created ON partner_sales(created_at);
