-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================================================
-- Issue: Policies on profiles table query profiles table, causing infinite recursion
-- Error Code: 42P17 - infinite recursion detected in policy for relation profiles
-- ============================================================================

-- ============================================================================
-- OPTION 1: DISABLE RLS ON PROBLEMATIC TABLES (QUICK FIX FOR ADMIN DEV)
-- ============================================================================

-- Disable RLS on profiles table to break recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on tables that reference profiles in their policies
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;

-- Disable RLS on content tables that admins need to access
ALTER TABLE treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_settings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on operational tables
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test profiles table access
SELECT 'Testing profiles table...' as status;
SELECT COUNT(*) as profile_count FROM profiles LIMIT 1;

-- Test treatments table access
SELECT 'Testing treatments table...' as status;
SELECT COUNT(*) as treatment_count FROM treatments LIMIT 1;

-- Test site_content table access
SELECT 'Testing site_content table...' as status;
SELECT COUNT(*) as content_count FROM site_content LIMIT 1;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This disables RLS for development/admin purposes.
-- For production, you should:
-- 1. Create a separate admins table that doesn't recurse
-- 2. Use auth.uid() directly without querying profiles
-- 3. Or use security definer functions to check roles
-- ============================================================================
