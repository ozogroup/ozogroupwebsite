# OZO / IA Skin Care - Authentication & Security Documentation

## Phase 3: RLS + Authentication + Role Security

### Files Created/Updated

1. **supabase/RLS_POLICIES.sql** - Complete RLS policies for all 25 tables
2. **lib/auth/helpers.ts** - Auth helper functions (getCurrentUser, requireAuth, requireAdmin, requirePartner, etc.)
3. **lib/auth/login.ts** - Login/logout Server Actions (adminLogin, partnerLogin, logoutAction)
4. **middleware.ts** - Route protection middleware for /admin/* and /partner/* routes

### TypeScript Errors (Expected)

The TypeScript errors in `lib/auth/helpers.ts` and `lib/auth/login.ts` are expected because:
- The `Database` type in `lib/supabase/types.ts` is currently a placeholder (Tables: Record<string, never>)
- These errors will be resolved after executing `SQL_SETUP.sql` and regenerating types with:
  ```bash
  npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.ts
  ```

---

## Admin Access Flow

### 1. Admin Login Process

```
User visits /admin/login
↓
Enters email and password
↓
Form submission → adminLogin Server Action
↓
Supabase Auth.signInWithPassword()
↓
If authentication fails → return error
↓
If authentication succeeds → verify role
↓
Query profiles table for role
↓
Check if role is 'super_admin', 'admin', or 'staff'
↓
If not admin role → sign out, return error
↓
If admin role → redirect to /admin/dashboard
```

### 2. Admin Route Protection

**Middleware Protection:**
- All `/admin/*` routes are protected by middleware
- `/admin/login` is the only public admin route
- Middleware checks for valid session
- Middleware verifies role in profiles table
- Unauthorized users redirected to `/unauthorized`

**Server-Side Protection:**
- Use `requireAdmin()` or `requireStaff()` in Server Components
- Use `requireSuperAdmin()` for super_admin only routes
- These helpers throw redirects if unauthorized

### 3. Admin Role Permissions

**super_admin:**
- Full system access
- Can edit system_settings
- Can edit commission_settings
- Can bypass referral lock (with logging)
- Can edit all data
- Can create other admins

**admin:**
- Operational control
- Can manage bookings, memberships, partners
- Can approve/reject commissions
- Can process payouts
- Cannot edit system_settings or commission_settings
- Cannot bypass referral lock

**staff:**
- Limited operational access
- Can view bookings, memberships
- Can update booking status
- Can view partner data
- Cannot approve commissions
- Cannot process payouts
- Cannot edit settings

---

## Partner Access Flow

### 1. Partner Login Process

```
User visits /partner/login
↓
Enters email and password
↓
Form submission → partnerLogin Server Action
↓
Supabase Auth.signInWithPassword()
↓
If authentication fails → return error
↓
If authentication succeeds → verify role
↓
Query profiles table for role
↓
Check if role is 'partner'
↓
If not partner → sign out, return error
↓
If partner → redirect to /partner/dashboard
```

### 2. Partner Route Protection

**Middleware Protection:**
- All `/partner/*` routes are protected by middleware
- `/partner/login` is the only public partner route
- Middleware checks for valid session
- Middleware verifies role is 'partner'
- Non-partners redirected to `/unauthorized`

**Server-Side Protection:**
- Use `requirePartner()` in Server Components
- Partners can only access their own data via RLS policies
- Partners cannot read other partners' data
- Partners cannot edit financial data directly

### 3. Partner Data Access (RLS Protected)

**Partners Can Read:**
- Own profile (partners table)
- Own wallet transactions (wallet_transactions table)
- Own commissions (commissions table)
- Own payouts (payouts table)
- Own statistics (daily_partner_stats table)
- Own support tickets (support_requests table)
- Own notifications (notifications table)
- Own referral tree (referral_tree where descendant = self)
- Own referral clicks (referral_clicks table)

**Partners Can Write:**
- Own support tickets (create)
- Own payouts (create, cancel own requested payouts)
- Limited profile updates (city, address, pin_code only)

**Partners Cannot Access:**
- Other partners' data
- Admin data
- System settings
- Commission settings
- Global payouts
- Unrelated commissions
- Activity logs
- Webhook logs
- Financial data of others

---

## First Admin Setup

### Step-by-Step Guide

**Prerequisites:**
- Supabase project created
- SQL_SETUP.sql executed
- RLS_POLICIES.sql executed
- Environment variables configured

**Step 1: Create Supabase Auth User**
```sql
-- Run in Supabase SQL Editor
-- This creates the auth user with email/password
-- Replace with your actual email and password

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin@ozo.com',
  crypt('YourSecurePassword123', gen_salt('bf')),
  NOW(),
  '{"full_name":"Super Admin"}',
  NOW(),
  NOW()
);
```

**Step 2: Create Profile Record**
```sql
-- Get the user ID from step 1
-- Replace <user_id> with actual UUID from step 1

INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '<user_id>',
  'admin@ozo.com',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
);
```

**Step 3: Create Admin Record**
```sql
-- Create extended admin profile

INSERT INTO admins (id, department, permissions, is_active, created_at)
VALUES (
  '<user_id>',
  'Management',
  '{"full_access": true}',
  true,
  NOW()
);
```

**Step 4: Verify Setup**
```sql
-- Verify all records created correctly

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  a.department,
  a.is_active
FROM profiles p
LEFT JOIN admins a ON a.id = p.id
WHERE p.email = 'admin@ozo.com';
```

**Step 5: Test Login**
1. Visit `/admin/login`
2. Enter email: `admin@ozo.com`
3. Enter password: `YourSecurePassword123`
4. Should redirect to `/admin/dashboard`

### Alternative: Use Supabase Dashboard

1. Go to Supabase Dashboard → Authentication
2. Click "Create New User"
3. Enter email: `admin@ozo.com`
4. Set password
5. Confirm email automatically (development mode)
6. Get user ID from user details
7. Run steps 2-3 in SQL Editor

---

## Protected Routes

### Admin Routes (Protected)
- `/admin/login` - Public (login page)
- `/admin/dashboard` - Protected (requires admin/staff/super_admin)
- `/admin/treatments` - Protected (requires admin/staff/super_admin)
- `/admin/bookings` - Protected (requires admin/staff/super_admin)
- `/admin/memberships` - Protected (requires admin/staff/super_admin)
- `/admin/partners` - Protected (requires admin/staff/super_admin)
- `/admin/referrals` - Protected (requires admin/staff/super_admin)
- `/admin/commissions` - Protected (requires admin/staff/super_admin)
- `/admin/payouts` - Protected (requires admin/staff/super_admin)
- `/admin/payments` - Protected (requires admin/staff/super_admin)
- `/admin/content` - Protected (requires admin/staff/super_admin)
- `/admin/settings` - Protected (requires super_admin only)
- `/admin/booking-slots` - Protected (requires admin/staff/super_admin)
- `/admin/activity-logs` - Protected (requires admin/staff/super_admin)
- `/admin/webhook-logs` - Protected (requires admin/staff/super_admin)

### Partner Routes (Protected)
- `/partner/login` - Public (login page)
- `/partner/dashboard` - Protected (requires partner)
- `/partner/profile` - Protected (requires partner)
- `/partner/referral-link` - Protected (requires partner)
- `/partner/direct-team` - Protected (requires partner)
- `/partner/team` - Protected (requires partner)
- `/partner/income` - Protected (requires partner)
- `/partner/commissions` - Protected (requires partner)
- `/partner/payouts` - Protected (requires partner)
- `/partner/support` - Protected (requires partner)
- `/partner/notifications` - Protected (requires partner)

### Public Routes (No Authentication Required)
- `/` - Home page
- `/about` - About page
- `/contact` - Contact page
- `/membership` - Membership page
- `/referral` - Referral page
- `/treatments` - Treatments pages
- `/treatments/[slug] - Treatment detail page
- `/thank-you` - Thank you page

---

## RLS Policy Summary

### Financial Tables (Strongest Protection)

**partners:**
- Partners: Read own only, limited write (city, address, pin_code)
- Admin/Staff: Read all, limited write (cannot change sponsor for active)
- Super Admin: Full access

**commissions:**
- Partners: Read own only, no write
- Admin/Staff: Read all, write (approve/reject)
- Super Admin: Full access

**wallet_transactions:**
- Partners: Read own only, no write
- Admin/Staff: Read all (audit), no write
- Super Admin: Full access

**payouts:**
- Partners: Create own, read own, limited update (cancel requested)
- Admin/Staff: Read all, write (process)
- Super Admin: Full access

**payments:**
- Public: No access
- Admin/Staff: Read all
- Super Admin: Full access

### Content Tables (Public Read)

**treatments:**
- Public: Read active only
- Content Manager: Read/write
- Admin/Staff: Read/write
- Super Admin: Full access

**site_content:**
- Public: Read active only
- Content Manager: Read/write
- Admin/Staff: Read/write
- Super Admin: Full access

**contact_settings:**
- Public: Read
- Content Manager: Write
- Admin/Staff: Write
- Super Admin: Full access

### System Tables (Restricted)

**system_settings:**
- Public: No access
- Admin/Staff: Read only
- Super Admin: Full access

**commission_settings:**
- Public: No access
- Content Manager: Read
- Admin/Staff: Read
- Super Admin: Full access

---

## Security Notes

### Critical Security Rules

1. **Service Role Key:**
   - Never exposed to browser
   - Only used in server-only files (marked with "server-only")
   - Bypasses RLS - use carefully

2. **Role Verification:**
   - Always verify role on server side
   - Never trust client-side role checks
   - Middleware provides first layer of protection
   - Server Components provide second layer

3. **Financial Data:**
   - Strongest RLS on financial tables
   - Partners cannot edit own financial data
   - All financial changes via Server Actions
   - Complete audit trail via wallet_transactions

4. **Referral Hierarchy:**
   - Database trigger prevents sponsor changes for active partners
   - Super admin can bypass with logging
   - Hierarchy becomes permanent after activation

### Future Security Enhancements

1. **OTP Verification:**
   - OTP logs table ready
   - Phone/email verification fields in profiles
   - Future: Implement 2FA for admin/partner login

2. **Social Login:**
   - Supabase Auth supports OAuth
   - Future: Add Google, Facebook login

3. **Rate Limiting:**
   - Future: Implement rate limiting on login attempts
   - Future: Implement rate limiting on API routes

4. **IP Whitelisting:**
   - Future: Whitelist admin IPs
   - Future: Geo-blocking for suspicious activity

---

## Next Steps

1. **Execute SQL:**
   - Run `supabase/SQL_SETUP.sql` in Supabase SQL Editor
   - Run `supabase/RLS_POLICIES.sql` in Supabase SQL Editor

2. **Generate Types:**
   - Regenerate TypeScript types from Supabase schema
   - This will fix TypeScript errors

3. **Create First Admin:**
   - Follow the first admin setup guide
   - Test admin login

4. **Test RLS:**
   - Test public access to treatments
   - Test partner access to own data
   - Test admin access to all data
   - Verify unauthorized access is blocked

5. **Build Admin Login Page:**
   - Create `/admin/login` page
   - Use `adminLogin` Server Action
   - Test login flow

6. **Build Partner Login Page:**
   - Create `/partner/login` page
   - Use `partnerLogin` Server Action
   - Test login flow

---

## Remaining Security Risks

1. **TypeScript Errors:**
   - Will resolve after SQL execution and type generation
   - Not a security risk, only development-time

2. **No Rate Limiting:**
   - Login attempts not rate-limited
   - Future enhancement needed

3. **No IP Whitelisting:**
   - Admin access not restricted by IP
   - Future enhancement needed

4. **No Session Timeout:**
   - Sessions valid until logout
   - Future enhancement needed

5. **No Audit for Login Attempts:**
   - Failed login attempts not logged
   - Future enhancement needed

---

**Phase 3 Complete: RLS + Authentication + Role Security foundation ready.**
