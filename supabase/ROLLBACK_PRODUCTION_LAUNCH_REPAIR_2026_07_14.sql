-- ============================================================================
-- KIA Skin Care - Rollback for Production Launch Repair
-- Date: 2026-07-14
--
-- This rollback is intentionally non-destructive by default:
--   * It does not delete production rows.
--   * It does not delete Auth users.
--   * It does not drop snapshot tables.
--   * It preserves generated business ID columns and their values.
--
-- Use this if the launch repair migration must be backed out before deployment.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Remove launch-repair policies.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;

DROP POLICY IF EXISTS public_read_contact_settings ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_admin_all" ON public.contact_settings;

-- ----------------------------------------------------------------------------
-- 2. Restore the safer public contact read policy only.
--    Admin writes should remain blocked until a corrected policy is applied.
-- ----------------------------------------------------------------------------
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_contact_settings
ON public.contact_settings
FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 3. Keep profiles RLS enabled with own-profile read.
--    Recursive admin policies are not restored.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 4. Disable generated-ID triggers while preserving assigned values.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_kia_assign_membership_id ON public.memberships;
DROP TRIGGER IF EXISTS trg_kia_assign_booking_ids ON public.bookings;
DROP TRIGGER IF EXISTS trg_kia_assign_partner_code_on_activation ON public.partners;
DROP TRIGGER IF EXISTS trg_kia_assign_referral_tree_transaction_id ON public.referral_tree;
DROP TRIGGER IF EXISTS trg_kia_assign_commission_referral_transaction_id ON public.commissions;

DROP FUNCTION IF EXISTS public.kia_assign_membership_id();
DROP FUNCTION IF EXISTS public.kia_assign_booking_ids();
DROP FUNCTION IF EXISTS public.kia_assign_partner_code_on_activation();
DROP FUNCTION IF EXISTS public.kia_assign_referral_transaction_id();
DROP FUNCTION IF EXISTS public.kia_next_partner_code();
DROP FUNCTION IF EXISTS public.kia_next_membership_id();
DROP FUNCTION IF EXISTS public.kia_next_booking_id();
DROP FUNCTION IF EXISTS public.kia_next_treatment_order_id();
DROP FUNCTION IF EXISTS public.kia_next_referral_transaction_id();
DROP FUNCTION IF EXISTS public.kia_lookup_referrer(text);
DROP FUNCTION IF EXISTS public.kia_is_admin(uuid);

-- ----------------------------------------------------------------------------
-- 5. Keep sequences and new columns intact so already-issued IDs remain auditable.
-- ----------------------------------------------------------------------------
-- Preserved sequences:
--   public.kia_partner_code_seq
--   public.kia_membership_id_seq
--   public.kia_booking_id_seq
--   public.kia_treatment_order_id_seq
--   public.kia_referral_transaction_id_seq
--
-- Preserved columns:
--   public.memberships.membership_id
--   public.bookings.booking_id
--   public.bookings.treatment_order_id
--   public.referral_tree.referral_transaction_id
--   public.commissions.referral_transaction_id

COMMIT;

-- ============================================================================
-- Snapshot tables left available for manual recovery:
--   public._kia_launch_backup_20260714_profiles
--   public._kia_launch_backup_20260714_partners
--   public._kia_launch_backup_20260714_memberships
--   public._kia_launch_backup_20260714_bookings
--   public._kia_launch_backup_20260714_contact_settings
--   public._kia_launch_backup_20260714_payments
--   public._kia_launch_backup_20260714_payouts
--   public._kia_launch_backup_20260714_commissions
--   public._kia_launch_backup_20260714_referral_tree
--   public._kia_launch_backup_20260714_referral_links
--   public._kia_launch_backup_20260714_partner_sales, if that table existed
-- ============================================================================
