-- ============================================================================
-- MIGRATION: Admin/Partner Panel - Profile Fields Addition
-- ============================================================================
-- Purpose: Add missing partner-related fields to profiles table
-- Date: 2025-01-08
-- Version: 1.0.0
--
-- SAFETY NOTES:
-- - Uses ALTER TABLE ADD COLUMN IF NOT EXISTS (safe, non-destructive)
-- - Does NOT drop or recreate any tables
-- - Does NOT remove any existing constraints
-- - Does NOT break RLS policies
-- - Keeps all existing relationships intact
-- - Production schema is preserved
-- ============================================================================

-- Add partner_code to profiles (for partner identification)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS partner_code TEXT UNIQUE;

-- Add sponsor_code to profiles (for tracking referral sponsor)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS sponsor_code TEXT;

-- Add membership_status to profiles (for partner membership tracking)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS membership_status membership_status DEFAULT 'pending';

-- Add city to profiles (for location tracking)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS city TEXT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
