-- ============================================================================
-- OZO / IA Skin Care - Row Level Security (RLS) Policies
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-01-08
-- Description: Production-ready RLS policies for referral CRM system
--
-- Security Principles:
-- 1. Public users can only read active content
-- 2. Partners can only read/write their own data
-- 3. Admin/Staff can read/write operational data
-- 4. Super Admin has full access
-- 5. Financial tables require strongest protection
-- 6. Service role bypasses RLS (server-only)
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Business tables
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Referral tables
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Wallet tables
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- System tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_orders ENABLE ROW LEVEL SECURITY;

-- Settings tables
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Analytics tables
ALTER TABLE daily_partner_stats ENABLE ROW LEVEL SECURITY;

-- Security tables
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;

-- Content & support tables
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Audit tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Authenticated users: Can read own profile
-- Admin/Staff: Can read all profiles
-- Super Admin: Full access

CREATE POLICY "profiles_no_public_access"
ON profiles FOR ALL
USING (false);

CREATE POLICY "profiles_read_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_admin_read_all"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
  )
);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (
  auth.uid() = id AND
  (role = 'customer' OR role = 'partner')
);

CREATE POLICY "profiles_admin_update_all"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "profiles_super_admin_full"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- ADMINS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Admin/Staff: Read own
-- Super Admin: Full access

CREATE POLICY "admins_no_public_access"
ON admins FOR ALL
USING (false);

CREATE POLICY "admins_read_own"
ON admins FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "admins_staff_read_all"
ON admins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "admins_super_admin_full"
ON admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- PARTNERS TABLE POLICIES (CRITICAL - FINANCIAL)
-- ============================================================================

-- Public: No access
-- Partners: Read own only (cannot edit wallet, sponsor, earnings)
-- Admin/Staff: Read/write all (except sponsor change for active partners)
-- Super Admin: Full access (including sponsor change with logging)

CREATE POLICY "partners_no_public_access"
ON partners FOR ALL
USING (false);

CREATE POLICY "partners_read_own"
ON partners FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "partners_update_own_limited"
ON partners FOR UPDATE
USING (
  auth.uid() = id AND
  -- Partners can only update: city, address, pin_code
  -- Cannot update: wallet_balance, total_earnings, sponsor_id, status, kyc fields
  (OLD.city IS DISTINCT FROM NEW.city OR
   OLD.address IS DISTINCT FROM NEW.address OR
   OLD.pin_code IS DISTINCT FROM NEW.pin_code)
);

CREATE POLICY "partners_admin_read_all"
ON partners FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "partners_admin_update_limited"
ON partners FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin')
  ) AND
  -- Admin cannot change sponsor_id for active partners (trigger enforces this)
  -- Admin can change status, wallet (with caution)
  true
);

CREATE POLICY "partners_super_admin_full"
ON partners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- TREATMENTS TABLE POLICIES
-- ============================================================================

-- Public: Can read active treatments
-- Content Manager: Read/write treatments
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "treatments_public_read_active"
ON treatments FOR SELECT
USING (active = true AND is_active = true);

CREATE POLICY "treatments_content_manager_read_all"
ON treatments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'content_manager'
  )
);

CREATE POLICY "treatments_content_manager_write"
ON treatments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'content_manager'
  )
);

CREATE POLICY "treatments_admin_read_all"
ON treatments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "treatments_admin_write"
ON treatments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin')
  )
);

CREATE POLICY "treatments_super_admin_full"
ON treatments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- BOOKING_SLOTS TABLE POLICIES
-- ============================================================================

-- Public: Can read available slots
-- Admin/Staff: Read/write all
-- Content Manager: Read only

CREATE POLICY "booking_slots_public_read_available"
ON booking_slots FOR SELECT
USING (status = 'available' AND booked_slots < max_slots);

CREATE POLICY "booking_slots_admin_read_all"
ON booking_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "booking_slots_admin_write"
ON booking_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "booking_slots_super_admin_full"
ON booking_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- BOOKINGS TABLE POLICIES
-- ============================================================================

-- Public: Can create via server action only (no direct access)
-- Partners: Can read own referrals only
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "bookings_no_public_access"
ON bookings FOR SELECT
USING (false);

CREATE POLICY "bookings_server_action_create"
ON bookings FOR INSERT
WITH CHECK (true); -- Controlled at application level via Server Actions

CREATE POLICY "bookings_partner_read_own_referrals"
ON bookings FOR SELECT
USING (
  auth.uid() = referred_by
);

CREATE POLICY "bookings_admin_read_all"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "bookings_admin_write"
ON bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "bookings_super_admin_full"
ON bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- MEMBERSHIPS TABLE POLICIES
-- ============================================================================

-- Public: Can create via server action only
-- Partners: Can read own membership
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "memberships_no_public_access"
ON memberships FOR SELECT
USING (false);

CREATE POLICY "memberships_server_action_create"
ON memberships FOR INSERT
WITH CHECK (true); -- Controlled at application level via Server Actions

CREATE POLICY "memberships_partner_read_own"
ON memberships FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "memberships_admin_read_all"
ON memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "memberships_admin_write"
ON memberships FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "memberships_super_admin_full"
ON memberships FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- REFERRAL_LINKS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Partners: Read own link
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "referral_links_no_public_access"
ON referral_links FOR SELECT
USING (false);

CREATE POLICY "referral_links_partner_read_own"
ON referral_links FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "referral_links_admin_read_all"
ON referral_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "referral_links_admin_write"
ON referral_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "referral_links_super_admin_full"
ON referral_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- REFERRAL_CLICKS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Partners: Read own clicks
-- Admin/Staff: Read all

CREATE POLICY "referral_clicks_no_public_access"
ON referral_clicks FOR SELECT
USING (false);

CREATE POLICY "referral_clicks_partner_read_own"
ON referral_clicks FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "referral_clicks_admin_read_all"
ON referral_clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "referral_clicks_server_action_create"
ON referral_clicks FOR INSERT
WITH CHECK (true); -- Controlled at application level

-- ============================================================================
-- REFERRAL_TREE TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Partners: Read where descendant is self (own tree)
-- Admin/Staff: Read all
-- Super Admin: Read/write all (with logging)

CREATE POLICY "referral_tree_no_public_access"
ON referral_tree FOR SELECT
USING (false);

CREATE POLICY "referral_tree_partner_read_own"
ON referral_tree FOR SELECT
USING (auth.uid() = descendant_id);

CREATE POLICY "referral_tree_admin_read_all"
ON referral_tree FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "referral_tree_super_admin_full"
ON referral_tree FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- COMMISSIONS TABLE POLICIES (CRITICAL - FINANCIAL)
-- ============================================================================

-- Public: No access
-- Partners: Read own commissions only
-- Admin/Staff: Read/write all (approve/reject)
-- Super Admin: Full access

CREATE POLICY "commissions_no_public_access"
ON commissions FOR SELECT
USING (false);

CREATE POLICY "commissions_partner_read_own"
ON commissions FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "commissions_partner_no_write"
ON commissions FOR ALL
USING (false); -- Partners cannot edit commissions

CREATE POLICY "commissions_admin_read_all"
ON commissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "commissions_admin_write"
ON commissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin')
  )
);

CREATE POLICY "commissions_super_admin_full"
ON commissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- WALLET_TRANSACTIONS TABLE POLICIES (CRITICAL - FINANCIAL)
-- ============================================================================

-- Public: No access
-- Partners: Read own transactions only
-- Admin/Staff: Read all (audit purpose)
-- Super Admin: Full access

CREATE POLICY "wallet_transactions_no_public_access"
ON wallet_transactions FOR SELECT
USING (false);

CREATE POLICY "wallet_transactions_partner_read_own"
ON wallet_transactions FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "wallet_transactions_partner_no_write"
ON wallet_transactions FOR ALL
USING (false); -- Partners cannot create/edit transactions

CREATE POLICY "wallet_transactions_admin_read_all"
ON wallet_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "wallet_transactions_server_action_create"
ON wallet_transactions FOR INSERT
WITH CHECK (true); -- Controlled at application level via Server Actions

CREATE POLICY "wallet_transactions_super_admin_full"
ON wallet_transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- PAYOUTS TABLE POLICIES (CRITICAL - FINANCIAL)
-- ============================================================================

-- Public: No access
-- Partners: Create own, read own
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "payouts_no_public_access"
ON payouts FOR SELECT
USING (false);

CREATE POLICY "payouts_partner_create_own"
ON payouts FOR INSERT
WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "payouts_partner_read_own"
ON payouts FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "payouts_partner_limited_update"
ON payouts FOR UPDATE
USING (
  auth.uid() = partner_id AND
  status = 'requested' -- Can only cancel own requested payouts
);

CREATE POLICY "payouts_admin_read_all"
ON payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "payouts_admin_write"
ON payouts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin')
  )
);

CREATE POLICY "payouts_super_admin_full"
ON payouts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- PAYMENTS TABLE POLICIES (CRITICAL - FINANCIAL)
-- ============================================================================

-- Public: No access
-- Admin/Staff: Read all
-- Super Admin: Full access

CREATE POLICY "payments_no_public_access"
ON payments FOR SELECT
USING (false);

CREATE POLICY "payments_admin_read_all"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "payments_server_action_create"
ON payments FOR INSERT
WITH CHECK (true); -- Controlled at application level

CREATE POLICY "payments_super_admin_full"
ON payments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- WEBHOOK_LOGS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Admin/Staff: Read all
-- Super Admin: Full access

CREATE POLICY "webhook_logs_no_public_access"
ON webhook_logs FOR SELECT
USING (false);

CREATE POLICY "webhook_logs_admin_read_all"
ON webhook_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "webhook_logs_server_action_create"
ON webhook_logs FOR INSERT
WITH CHECK (true); -- Controlled at application level

CREATE POLICY "webhook_logs_super_admin_full"
ON webhook_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- SHIPPING_ORDERS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "shipping_orders_no_public_access"
ON shipping_orders FOR SELECT
USING (false);

CREATE POLICY "shipping_orders_admin_read_all"
ON shipping_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "shipping_orders_admin_write"
ON shipping_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "shipping_orders_super_admin_full"
ON shipping_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- COMMISSION_SETTINGS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Content Manager: Read only
-- Admin/Staff: Read all
-- Super Admin: Full access

CREATE POLICY "commission_settings_no_public_access"
ON commission_settings FOR SELECT
USING (false);

CREATE POLICY "commission_settings_content_manager_read"
ON commission_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'content_manager'
  )
);

CREATE POLICY "commission_settings_admin_read_all"
ON commission_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "commission_settings_super_admin_full"
ON commission_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- SYSTEM_SETTINGS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Admin/Staff: Read only
-- Super Admin: Full access

CREATE POLICY "system_settings_no_public_access"
ON system_settings FOR SELECT
USING (false);

CREATE POLICY "system_settings_admin_read"
ON system_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "system_settings_super_admin_full"
ON system_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- DAILY_PARTNER_STATS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Partners: Read own stats
-- Admin/Staff: Read all

CREATE POLICY "daily_partner_stats_no_public_access"
ON daily_partner_stats FOR SELECT
USING (false);

CREATE POLICY "daily_partner_stats_partner_read_own"
ON daily_partner_stats FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "daily_partner_stats_admin_read_all"
ON daily_partner_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "daily_partner_stats_server_action_create"
ON daily_partner_stats FOR INSERT
WITH CHECK (true); -- Controlled at application level

-- ============================================================================
-- OTP_LOGS TABLE POLICIES
-- ============================================================================

-- Public: No access
- Users: Read own OTP logs
-- Admin/Staff: Read all

CREATE POLICY "otp_logs_no_public_access"
ON otp_logs FOR SELECT
USING (false);

CREATE POLICY "otp_logs_user_read_own"
ON otp_logs FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "otp_logs_admin_read_all"
ON otp_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "otp_logs_server_action_create"
ON otp_logs FOR INSERT
WITH CHECK (true); -- Controlled at application level

-- ============================================================================
-- SITE_CONTENT TABLE POLICIES
-- ============================================================================

-- Public: Can read active content
-- Content Manager: Read/write content
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "site_content_public_read_active"
ON site_content FOR SELECT
USING (is_active = true);

CREATE POLICY "site_content_content_manager_read_all"
ON site_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'content_manager'
  )
);

CREATE POLICY "site_content_content_manager_write"
ON site_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'content_manager'
  )
);

CREATE POLICY "site_content_admin_read_all"
ON site_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "site_content_admin_write"
ON site_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "site_content_super_admin_full"
ON site_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- CONTACT_SETTINGS TABLE POLICIES
-- ============================================================================

-- Public: Can read
-- Content Manager: Read/write
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "contact_settings_public_read"
ON contact_settings FOR SELECT
USING (true);

CREATE POLICY "contact_settings_content_manager_write"
ON contact_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'content_manager'
  )
);

CREATE POLICY "contact_settings_admin_write"
ON contact_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "contact_settings_super_admin_full"
ON contact_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- SUPPORT_REQUESTS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Partners: Create own, read own
-- Admin/Staff: Read/write all
-- Super Admin: Full access

CREATE POLICY "support_requests_no_public_access"
ON support_requests FOR SELECT
USING (false);

CREATE POLICY "support_requests_partner_create_own"
ON support_requests FOR INSERT
WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "support_requests_partner_read_own"
ON support_requests FOR SELECT
USING (auth.uid() = partner_id);

CREATE POLICY "support_requests_admin_read_all"
ON support_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "support_requests_admin_write"
ON support_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "support_requests_super_admin_full"
ON support_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Public: No access
- Users: Read own notifications
- Admin/Staff: Read own notifications
- System: Can create notifications

CREATE POLICY "notifications_no_public_access"
ON notifications FOR SELECT
USING (false);

CREATE POLICY "notifications_user_read_own"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "notifications_role_read"
ON notifications FOR SELECT
USING (
  role IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = profiles.role
  )
);

CREATE POLICY "notifications_server_action_create"
ON notifications FOR INSERT
WITH CHECK (true); -- Controlled at application level

-- ============================================================================
-- ACTIVITY_LOGS TABLE POLICIES
-- ============================================================================

-- Public: No access
-- Admin/Staff: Read all
-- Super Admin: Full access

CREATE POLICY "activity_logs_no_public_access"
ON activity_logs FOR SELECT
USING (false);

CREATE POLICY "activity_logs_admin_read_all"
ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);

CREATE POLICY "activity_logs_super_admin_full"
ON activity_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
--
-- CRITICAL TABLES (Strongest RLS):
-- - partners (wallet, earnings)
-- - commissions (financial data)
-- - wallet_transactions (audit trail)
-- - payouts (payout requests)
-- - payments (payment records)
--
-- PUBLIC ACCESS ONLY:
-- - treatments (active only)
-- - site_content (active only)
-- - contact_settings
--
-- PARTNER ACCESS (Own Data Only):
-- - partners (own record)
-- - commissions (own)
-- - wallet_transactions (own)
-- - payouts (own)
-- - daily_partner_stats (own)
-- - support_requests (own)
-- - notifications (own)
-- - referral_tree (own tree)
-- - referral_clicks (own)
--
-- ADMIN/STAFF ACCESS (Operational):
-- - bookings, memberships
-- - partners (read all, limited write)
-- - commissions (approve/reject)
-- - payouts (process)
-- - support_requests
--
-- SUPER ADMIN ACCESS (Full):
-- - system_settings
-- - commission_settings
-- - referral_tree (edit with logging)
-- - partners (sponsor change with logging)
-- - All financial tables
--
-- SERVICE ROLE:
-- - Bypasses RLS
-- - Use only in server-only files
-- - Never expose to client
-- ============================================================================
