-- ============================================================================
-- OZO / IA Skin Care - Complete Database Schema
-- ============================================================================
-- Version: 2.0.0 (Production Hardened)
-- Date: 2025-01-08
-- Description: Production-ready Supabase database schema for referral CRM system
--
-- Tables: 25
-- - Core: profiles, admins, partners
-- - Business: treatments, booking_slots, bookings, memberships
-- - Referral: referral_links, referral_tree, commissions, referral_clicks
-- - Wallet: wallet_transactions, payouts
-- - System: payments, webhook_logs, shipping_orders
-- - Settings: commission_settings, system_settings
-- - Analytics: daily_partner_stats
-- - Security: otp_logs
-- - Content: site_content, contact_settings
-- - Support: support_requests
-- - Audit: notifications, activity_logs
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- Enable UUID generation (already enabled in Supabase by default)
-- Enable pgcrypto for encryption (optional, for KYC data)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'staff',
  'content_manager',
  'partner',
  'customer'
);
END IF; END$$;

-- Partner status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_status') THEN
CREATE TYPE partner_status AS ENUM (
  'approved',
  'active',
  'inactive',
  'pending',
  'suspended'
);
ELSE
  -- Add 'approved' if enum already exists but missing this value
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'partner_status') AND enumlabel = 'approved') THEN
    ALTER TYPE partner_status ADD VALUE 'approved';
  END IF;
END IF; END$$;

-- KYC status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
CREATE TYPE kyc_status AS ENUM (
  'not_submitted',
  'pending',
  'verified',
  'rejected'
);
END IF; END$$;

-- Treatment type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_type') THEN
CREATE TYPE treatment_type AS ENUM (
  'home_kit',
  'clinic',
  'campaign'
);
END IF; END$$;

-- Booking status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);
END IF; END$$;

-- Payment status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
CREATE TYPE payment_status AS ENUM (
  'pending_payment',
  'paid',
  'failed'
);
END IF; END$$;

-- Membership status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
CREATE TYPE membership_status AS ENUM (
  'pending_payment',
  'paid',
  'under_review',
  'approved',
  'rejected',
  'active',
  'expired'
);
END IF; END$$;

-- Commission status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status') THEN
CREATE TYPE commission_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'rejected'
);
END IF; END$$;

-- Wallet transaction type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_type') THEN
CREATE TYPE wallet_transaction_type AS ENUM (
  'commission_credit',
  'payout_debit',
  'adjustment_credit',
  'adjustment_debit'
);
END IF; END$$;

-- Reference type for wallet transactions
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reference_type') THEN
CREATE TYPE reference_type AS ENUM (
  'commission',
  'payout',
  'manual_adjustment'
);
END IF; END$$;

-- Payout status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
CREATE TYPE payout_status AS ENUM (
  'requested',
  'processing',
  'paid',
  'rejected'
);
END IF; END$$;

-- Razorpay payment status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'razorpay_status') THEN
CREATE TYPE razorpay_status AS ENUM (
  'created',
  'authorized',
  'captured',
  'refunded',
  'failed'
);
END IF; END$$;

-- Source type for payments
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
CREATE TYPE source_type AS ENUM (
  'membership',
  'booking'
);
END IF; END$$;

-- Booking slot status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_status') THEN
CREATE TYPE slot_status AS ENUM (
  'available',
  'full',
  'cancelled'
);
END IF; END$$;

-- Shipping status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_status') THEN
CREATE TYPE shipping_status AS ENUM (
  'pending',
  'created',
  'shipped',
  'delivered',
  'cancelled'
);
END IF; END$$;

-- Webhook provider
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_provider') THEN
CREATE TYPE webhook_provider AS ENUM (
  'razorpay',
  'shiprocket'
);
END IF; END$$;

-- Support ticket status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_status') THEN
CREATE TYPE support_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);
END IF; END$$;

-- Notification type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
CREATE TYPE notification_type AS ENUM (
  'membership_approved',
  'membership_rejected',
  'new_referral',
  'commission_generated',
  'commission_approved',
  'payout_requested',
  'payout_paid',
  'new_booking',
  'booking_confirmed',
  'shipping_updated'
);
END IF; END$$;

-- OTP type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'otp_type') THEN
CREATE TYPE otp_type AS ENUM (
  'phone_verification',
  'email_verification',
  'password_reset',
  'login_2fa'
);
END IF; END$$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- profiles: User profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- admins: Extended admin profile data
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  department TEXT,
  permissions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- partners: Partner-specific data with KYC
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  partner_code TEXT UNIQUE NOT NULL,
  city TEXT,
  address TEXT,
  pin_code TEXT,
  sponsor_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  status partner_status NOT NULL DEFAULT 'pending',
  wallet_balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
  total_earnings NUMERIC(15, 2) DEFAULT 0.00,
  paid_earnings NUMERIC(15, 2) DEFAULT 0.00,
  referral_link TEXT,
  membership_purchased_at TIMESTAMPTZ,
  
  -- KYC fields
  kyc_status kyc_status DEFAULT 'not_submitted',
  pan_number TEXT,
  aadhaar_last4 TEXT,
  bank_account_holder TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  upi_id TEXT,
  bank_verified BOOLEAN DEFAULT FALSE,
  payout_hold_reason TEXT,
  
  -- Fraud detection
  suspicious_flag BOOLEAN DEFAULT FALSE,
  fraud_notes TEXT,
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BUSINESS TABLES
-- ============================================================================

-- treatments: Treatment catalog
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type treatment_type NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  price_label TEXT,
  unit TEXT,
  tagline TEXT,
  subtitle TEXT,
  description TEXT,
  benefits JSONB,
  process_steps JSONB,
  who_for TEXT,
  safety TEXT,
  faqs JSONB,
  duration TEXT,
  sessions TEXT,
  badge TEXT,
  image TEXT,
  image_alt TEXT,
  tone TEXT,
  active BOOLEAN DEFAULT TRUE,
  requires_slots BOOLEAN DEFAULT FALSE,
  available_cities JSONB,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- booking_slots: Campaign/clinic slot management
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  max_slots INTEGER NOT NULL,
  booked_slots INTEGER DEFAULT 0 CHECK (booked_slots >= 0),
  status slot_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings: Treatment bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  booking_slot_id UUID REFERENCES booking_slots(id) ON DELETE SET NULL,
  booking_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  referral_code TEXT,
  referred_by UUID REFERENCES partners(id) ON DELETE SET NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending_payment',
  booking_status booking_status NOT NULL DEFAULT 'pending',
  payment_amount NUMERIC(15, 2),
  notes TEXT,
  admin_notes TEXT,
  shipping_status shipping_status,
  courier_name TEXT,
  tracking_id TEXT,
  
  -- Refund support
  cancellation_reason TEXT,
  cancelled_by TEXT,
  refund_status TEXT,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- memberships: Membership purchases
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID UNIQUE REFERENCES partners(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  referral_code TEXT,
  sponsor_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending_payment',
  membership_status membership_status NOT NULL DEFAULT 'pending_payment',
  payment_id TEXT,
  notes TEXT,
  admin_notes TEXT,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REFERRAL TABLES
-- ============================================================================

-- referral_links: Referral link tracking
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
  partner_code TEXT UNIQUE NOT NULL,
  referral_link TEXT NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- referral_clicks: Referral link visit tracking
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  city TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_membership BOOLEAN DEFAULT FALSE
);

-- referral_tree: Explicit hierarchy tracking
CREATE TABLE IF NOT EXISTS referral_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ancestor_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- commissions: Commission records
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  source_id UUID NOT NULL,
  source_amount NUMERIC(15, 2) NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
  percentage NUMERIC(5, 2) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payout_id UUID,
  
  -- Commission reversal support
  reversed BOOLEAN DEFAULT FALSE,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Duplicate prevention
  UNIQUE(source_type, source_id, partner_id, level)
);

-- ============================================================================
-- WALLET TABLES
-- ============================================================================

-- wallet_transactions: Wallet audit trail
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  transaction_type wallet_transaction_type NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2) NOT NULL,
  reference_type reference_type NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payouts: Payout requests
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  available_balance NUMERIC(15, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status payout_status NOT NULL DEFAULT 'requested',
  payment_proof TEXT,
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- payments: Razorpay payment records
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  payment_id TEXT UNIQUE,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status razorpay_status NOT NULL DEFAULT 'created',
  source_type source_type NOT NULL,
  source_id UUID NOT NULL,
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB,
  
  -- Refund support
  refund_amount NUMERIC(15, 2),
  refund_status TEXT,
  refunded_at TIMESTAMPTZ,
  refund_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- webhook_logs: Webhook event logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider webhook_provider NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- shipping_orders: Shiprocket shipping
CREATE TABLE IF NOT EXISTS shipping_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  shiprocket_order_id TEXT UNIQUE,
  courier_name TEXT,
  tracking_id TEXT,
  tracking_url TEXT,
  status shipping_status DEFAULT 'pending',
  estimated_delivery DATE,
  shiprocket_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS TABLES
-- ============================================================================

-- commission_settings: Commission percentage configuration
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_1_percentage NUMERIC(5, 2) NOT NULL DEFAULT 6.00,
  level_2_percentage NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
  level_3_percentage NUMERIC(5, 2) NOT NULL DEFAULT 1.70,
  level_4_percentage NUMERIC(5, 2) NOT NULL DEFAULT 1.20,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- system_settings: System-wide configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT TRUE,
  commissions_enabled BOOLEAN DEFAULT TRUE,
  bookings_enabled BOOLEAN DEFAULT TRUE,
  membership_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- daily_partner_stats: Daily partner statistics for dashboard
CREATE TABLE IF NOT EXISTS daily_partner_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  direct_team_count INTEGER DEFAULT 0,
  total_team_count INTEGER DEFAULT 0,
  daily_earnings NUMERIC(15, 2) DEFAULT 0.00,
  total_earnings NUMERIC(15, 2) DEFAULT 0.00,
  pending_earnings NUMERIC(15, 2) DEFAULT 0.00,
  paid_earnings NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECURITY TABLES
-- ============================================================================

-- otp_logs: OTP verification logs
CREATE TABLE IF NOT EXISTS otp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  otp_type otp_type NOT NULL,
  sent_to TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- CONTENT & SUPPORT TABLES
-- ============================================================================

-- site_content: CMS for site content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- contact_settings: Contact page settings
CREATE TABLE IF NOT EXISTS contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT,
  whatsapp_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- support_requests: Partner support tickets
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status support_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT TABLES
-- ============================================================================

-- notifications: System notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- activity_logs: Admin/partner action logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role user_role NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- admins
CREATE INDEX IF NOT EXISTS idx_admins_id ON admins(id);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active) WHERE deleted_at IS NULL;

-- partners
CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_partners_sponsor ON partners(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active) WHERE deleted_at IS NULL;

-- treatments
CREATE INDEX IF NOT EXISTS idx_treatments_slug ON treatments(slug);
CREATE INDEX IF NOT EXISTS idx_treatments_type ON treatments(type);
CREATE INDEX IF NOT EXISTS idx_treatments_active ON treatments(active);
CREATE INDEX IF NOT EXISTS idx_treatments_is_active ON treatments(is_active) WHERE deleted_at IS NULL;

-- booking_slots
CREATE INDEX IF NOT EXISTS idx_booking_slots_treatment ON booking_slots(treatment_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_city ON booking_slots(city);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON booking_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_status ON booking_slots(status);

-- bookings
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_treatment ON bookings(treatment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_referred_by ON bookings(referred_by);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(booking_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_is_active ON bookings(is_active) WHERE deleted_at IS NULL;

-- memberships
CREATE INDEX IF NOT EXISTS idx_memberships_partner ON memberships(partner_id);
CREATE INDEX IF NOT EXISTS idx_memberships_mobile ON memberships(mobile);
CREATE INDEX IF NOT EXISTS idx_memberships_sponsor ON memberships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(membership_status);
CREATE INDEX IF NOT EXISTS idx_memberships_is_active ON memberships(is_active) WHERE deleted_at IS NULL;

-- referral_links
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(partner_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_partner ON referral_links(partner_id);

-- referral_clicks
CREATE INDEX IF NOT EXISTS idx_referral_clicks_partner ON referral_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_clicked_at ON referral_clicks(clicked_at);

-- referral_tree
CREATE INDEX IF NOT EXISTS idx_referral_tree_ancestor ON referral_tree(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_referral_tree_descendant ON referral_tree(descendant_id);
CREATE INDEX IF NOT EXISTS idx_referral_tree_level ON referral_tree(level);

-- commissions
CREATE INDEX IF NOT EXISTS idx_commissions_partner ON commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_source ON commissions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_is_active ON commissions(is_active) WHERE deleted_at IS NULL;

-- wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_partner ON wallet_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_wallet_reference ON wallet_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_type ON wallet_transactions(transaction_type);

-- payouts
CREATE INDEX IF NOT EXISTS idx_payouts_partner ON payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_is_active ON payouts(is_active) WHERE deleted_at IS NULL;

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_source ON payments(source_type, source_id);

-- webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_event ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_logs(processed);

-- shipping_orders
CREATE INDEX IF NOT EXISTS idx_shipping_booking ON shipping_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking ON shipping_orders(tracking_id);

-- site_content
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page);
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(content_key);
CREATE INDEX IF NOT EXISTS idx_site_content_is_active ON site_content(is_active) WHERE deleted_at IS NULL;

-- support_requests
CREATE INDEX IF NOT EXISTS idx_support_partner ON support_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_requests(status);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_status);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);

-- commission_settings
CREATE INDEX IF NOT EXISTS idx_commission_settings_active ON commission_settings(active);

-- system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_maintenance ON system_settings(maintenance_mode);

-- daily_partner_stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_partner ON daily_partner_stats(partner_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_partner_stats(stat_date);

-- otp_logs
CREATE INDEX IF NOT EXISTS idx_otp_logs_profile ON otp_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created ON otp_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_logs_expires ON otp_logs(expires_at);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables with updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_partners_updated_at ON partners;
CREATE TRIGGER trg_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_treatments_updated_at ON treatments;
CREATE TRIGGER trg_treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_booking_slots_updated_at ON booking_slots;
CREATE TRIGGER trg_booking_slots_updated_at
  BEFORE UPDATE ON booking_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_memberships_updated_at ON memberships;
CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_commissions_updated_at ON commissions;
CREATE TRIGGER trg_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payouts_updated_at ON payouts;
CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_site_content_updated_at ON site_content;
CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contact_settings_updated_at ON contact_settings;
CREATE TRIGGER trg_contact_settings_updated_at
  BEFORE UPDATE ON contact_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_support_requests_updated_at ON support_requests;
CREATE TRIGGER trg_support_requests_updated_at
  BEFORE UPDATE ON support_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_shipping_orders_updated_at ON shipping_orders;
CREATE TRIGGER trg_shipping_orders_updated_at
  BEFORE UPDATE ON shipping_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_commission_settings_updated_at ON commission_settings;
CREATE TRIGGER trg_commission_settings_updated_at
  BEFORE UPDATE ON commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Prevent sponsor_id changes for active partners (Referral Lock)
CREATE OR REPLACE FUNCTION prevent_sponsor_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.sponsor_id IS DISTINCT FROM NEW.sponsor_id THEN
    IF OLD.status = 'active' THEN
      RAISE EXCEPTION 'Cannot change sponsor_id for active partner. Hierarchy is locked.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_sponsor_change ON partners;
CREATE TRIGGER trg_prevent_sponsor_change
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sponsor_change();

-- Function: Activity logging helper (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(),
    (SELECT role FROM profiles WHERE id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the main operation if logging fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging to critical tables
DROP TRIGGER IF EXISTS log_partners_changes ON partners;
CREATE TRIGGER log_partners_changes
  AFTER INSERT OR UPDATE OR DELETE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_commissions_changes ON commissions;
CREATE TRIGGER log_commissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_payouts_changes ON payouts;
CREATE TRIGGER log_payouts_changes
  AFTER INSERT OR UPDATE OR DELETE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_memberships_changes ON memberships;
CREATE TRIGGER log_memberships_changes
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_bookings_changes ON bookings;
CREATE TRIGGER log_bookings_changes
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status)
  EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_treatments_changes ON treatments;
CREATE TRIGGER log_treatments_changes
  AFTER UPDATE ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Wallet balance non-negative (already added in table definition)
-- Additional check to ensure wallet_balance never goes negative
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_balance_non_negative') THEN
    ALTER TABLE partners ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (wallet_balance >= 0);
  END IF;
END$$;

-- Ensure booking_slots doesn't exceed max_slots
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_slots_not_exceed_max') THEN
    ALTER TABLE booking_slots ADD CONSTRAINT chk_slots_not_exceed_max CHECK (booked_slots <= max_slots);
  END IF;
END$$;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default contact settings (only if table is empty)
INSERT INTO contact_settings (whatsapp_number, whatsapp_url, email, phone, address)
SELECT '+919876543210', 'https://wa.me/919876543210', 'contact@ozo.com', '+91-9876543210', 'Mumbai, Maharashtra, India'
WHERE NOT EXISTS (SELECT 1 FROM contact_settings);

-- Insert default commission settings (only if table is empty)
INSERT INTO commission_settings (level_1_percentage, level_2_percentage, level_3_percentage, level_4_percentage, active)
SELECT 6.00, 3.00, 1.70, 1.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM commission_settings);

-- Insert default system settings (only if table is empty)
INSERT INTO system_settings (maintenance_mode, payouts_enabled, commissions_enabled, bookings_enabled, membership_enabled)
SELECT FALSE, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
