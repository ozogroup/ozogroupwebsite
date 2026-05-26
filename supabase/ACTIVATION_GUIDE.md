# KIA Skin Care - Supabase Activation Guide

## Phase 4.5: Supabase Live Activation + Type Generation + First Admin Setup

This guide provides step-by-step instructions to activate the Supabase backend, generate TypeScript types, set up the first admin user, and verify the entire system.

---

## 1. SQL Execution Guide

### Prerequisites
- Supabase project created
- Project URL and anon key added to `.env.local`
- Service role key added to `.env.local`

### Execution Order

**Step 1: Execute SQL_SETUP.sql**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your KIA Skin Care project
3. Navigate to: SQL Editor (left sidebar)
4. Click "New Query"
5. Open file: `supabase/SQL_SETUP.sql` (copy entire content)
6. Paste into SQL Editor
7. Click "Run" (or press Ctrl+Enter)
8. Wait for execution (should take 5-10 seconds)

**Expected Results:**
- Success message: "Success. No rows returned"
- Tables created: 25 tables
- Enums created: 20 enums
- Indexes created: 65+ indexes
- Triggers created: 15 triggers
- Functions created: 3 functions
- Initial data inserted (contact_settings, commission_settings, system_settings)

**Verification:**
1. Navigate to: Database → Tables
2. You should see 25 tables listed
3. Click on any table (e.g., `profiles`) to verify structure
4. Navigate to: Database → Functions
5. You should see 3 functions listed
6. Navigate to: Database → Triggers
7. You should see 15 triggers listed

**Common Errors & Solutions:**

- **Error:** "relation already exists"
  - **Solution:** Drop all tables first (see cleanup section below) or continue if tables exist

- **Error:** "extension already exists"
  - **Solution:** Safe to ignore, extension already installed

- **Error:** "permission denied"
  - **Solution:** Ensure you have admin access to Supabase project

**Step 2: Execute RLS_POLICIES.sql**

1. Still in SQL Editor
2. Click "New Query"
3. Open file: `supabase/RLS_POLICIES.sql` (copy entire content)
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for execution (should take 5-10 seconds)

**Expected Results:**
- Success message: "Success. No rows returned"
- RLS enabled on all 25 tables
- 100+ policies created

**Verification:**
1. Navigate to: Database → Tables
2. Click on any table (e.g., `profiles`)
3. Click "RLS Policies" tab
4. You should see multiple policies listed
5. Verify policies match the table type (e.g., `partners` should have financial protection)

**Common Errors & Solutions:**

- **Error:** "policy already exists"
  - **Solution:** Safe to ignore, or drop and recreate policies

- **Error:** "relation does not exist"
  - **Solution:** Ensure SQL_SETUP.sql was executed first

---

## 2. Types Generation

### Prerequisites
- Supabase CLI installed (if using CLI method)
- Project ID known (from Supabase Dashboard)
- SQL executed successfully

### Method 1: Using Supabase CLI (Recommended)

**Step 1: Install Supabase CLI (if not installed)**
```bash
npm install -g supabase
```

**Step 2: Login to Supabase**
```bash
supabase login
```
- This will open browser for authentication
- Login with your Supabase account

**Step 3: Link Project**
```bash
supabase link --project-ref <your-project-id>
```
- Replace `<your-project-id>` with your actual project ID
- Project ID can be found in Supabase Dashboard → Settings → General

**Step 4: Generate TypeScript Types**
```bash
supabase gen types typescript --project-id <your-project-id> --schema public > lib/supabase/types.ts
```
- Replace `<your-project-id>` with your actual project ID
- This will overwrite `lib/supabase/types.ts`

**Verification:**
1. Open file: `lib/supabase/types.ts`
2. You should see a large file with type definitions
3. Should contain `Database` interface with all 25 tables
4. Should contain `Tables`, `Views`, `Functions`, `Enums` types

### Method 2: Using Supabase Dashboard (Alternative)

**Step 1: Go to Supabase Dashboard**
- Navigate to: Settings → API

**Step 2: Copy Project ID**
- Copy the Project Reference ID

**Step 3: Generate Types (Manual)**
- Use the same command as Method 1, Step 4
- This works even without linking the project

**Verification:**
Same as Method 1

---

## 3. Fix TypeScript Errors

### Current Issue
After type generation, you may still see TypeScript errors related to:
- `Property 'role' does not exist on type 'never'`
- Type mismatches in auth helpers
- Type mismatches in server actions

### Fix Steps

**Step 1: Regenerate Types**
```bash
supabase gen types typescript --project-id <your-project-id> --schema public > lib/supabase/types.ts
```

**Step 2: Restart TypeScript Server**
- In VS Code: Press Ctrl+Shift+P → "TypeScript: Restart TS Server"
- Or restart your IDE

**Step 3: Check for Remaining Errors**
- Open any file that had errors
- TypeScript should now infer correct types
- If errors persist, check:
  - Database types were actually generated
  - File path is correct
  - No syntax errors in SQL_SETUP.sql

**Step 4: Verify Auth Helpers**
- Open: `lib/auth/helpers.ts`
- Should have no TypeScript errors
- Profile type should be inferred correctly

**Step 5: Verify Server Actions**
- Open: `lib/auth/actions.ts`
- Should have no TypeScript errors
- Profile.role should be recognized

**Step 6: Verify Middleware**
- Open: `middleware.ts`
- Should have no TypeScript errors
- Profile.role should be recognized

---

## 4. First Super Admin Setup

### Safest Professional Setup

This guide provides the safest method to create the first super admin user.

### Method 1: Using Supabase Dashboard (Recommended)

**Step 1: Create Auth User via Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email: `admin@ozo.com` (or your preferred email)
4. Enter password: Use a strong password
5. Set "Auto Confirm User" to ON (for development)
6. Click "Create user"

**Step 2: Get User ID**
1. After user is created, click on the user row
2. Copy the User ID (UUID) from the details panel

**Step 3: Create Profile Record**
1. Go to SQL Editor
2. Run this SQL (replace `<user-id>` with actual UUID):

```sql
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '<user-id>',
  'admin@ozo.com',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
);
```

**Step 4: Create Admin Record**
```sql
INSERT INTO admins (id, department, permissions, is_active, created_at)
VALUES (
  '<user-id>',
  'Management',
  '{"full_access": true}',
  true,
  NOW()
);
```

**Step 5: Verify Setup**
```sql
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

Expected output: One row with role 'super_admin' and is_active true

### Method 2: Using SQL Only (Alternative)

**Step 1: Create Auth User via SQL**
```sql
-- Run in SQL Editor
-- Replace email and password with your actual values

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

**Step 2: Get User ID**
```sql
SELECT id, email FROM auth.users WHERE email = 'admin@ozo.com';
```
Copy the id (UUID) from the result

**Step 3: Create Profile Record**
```sql
-- Replace <user-id> with actual UUID from step 2

INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '<user-id>',
  'admin@ozo.com',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
);
```

**Step 4: Create Admin Record**
```sql
INSERT INTO admins (id, department, permissions, is_active, created_at)
VALUES (
  '<user-id>',
  'Management',
  '{"full_access": true}',
  true,
  NOW()
);
```

**Step 5: Verify Setup**
```sql
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

---

## 5. Login Test Flow

### Test Admin Login

**Step 1: Start Development Server**
```bash
npm run dev
```

**Step 2: Visit Admin Login Page**
- Open browser: http://localhost:3000/admin/login
- Should see login page with "Admin Panel" heading

**Step 3: Enter Credentials**
- Email: `admin@ozo.com` (or your admin email)
- Password: Your password
- Click "Sign In"

**Expected Result:**
- Redirected to `/admin/dashboard`
- Should see admin dashboard with sidebar and topbar
- Should see "Welcome, Admin" message

**If Login Fails:**
- Check error message in URL (e.g., `/admin/login?error=...`)
- Common errors:
  - "Invalid login credentials" → Wrong password
  - "Unauthorized: Admin access only" → User not admin role
  - "Authentication failed" → User not found

### Test Middleware Protection

**Step 1: Test Protected Route Without Login**
1. Logout (if logged in)
2. Visit: http://localhost:3000/admin/dashboard
3. Expected: Redirected to `/admin/login`

**Step 2: Test Protected Route With Login**
1. Login as admin
2. Visit: http://localhost:3000/admin/dashboard
3. Expected: Access granted, dashboard visible

**Step 3: Test Unauthorized Redirect**
1. Create a regular user (customer role)
2. Login as customer
3. Visit: http://localhost:3000/admin/dashboard
4. Expected: Redirected to `/unauthorized`

**Step 4: Test Unauthorized Page**
1. Visit: http://localhost:3000/unauthorized
2. Expected: "Access Denied" message with "Return Home" button

### Test Session Handling

**Step 1: Test Session Persistence**
1. Login as admin
2. Refresh page
3. Expected: Still logged in, dashboard visible

**Step 2: Test Logout**
1. Click "Sign Out" in sidebar
2. Expected: Redirected to home page (`/`)

**Step 3: Test Session Expiry**
1. Login as admin
2. Wait for session to expire (or manually revoke in Supabase)
3. Refresh page
4. Expected: Redirected to `/admin/login`

---

## 6. Storage Setup

### Manual Storage Bucket Creation

**Step 1: Go to Storage**
1. Supabase Dashboard → Storage (left sidebar)

**Step 2: Create Buckets**

Create the following buckets with these settings:

#### 1. treatments
- **Public:** Yes
- **File Size Limit:** 5MB
- **Allowed MIME Types:** image/jpeg, image/png, image/webp, image/svg+xml
- **Purpose:** Treatment images

#### 2. banners
- **Public:** Yes
- **File Size Limit:** 5MB
- **Allowed MIME Types:** image/jpeg, image/png, image/webp
- **Purpose:** Homepage banners, marketing images

#### 3. memberships
- **Public:** No
- **File Size Limit:** 2MB
- **Allowed MIME Types:** application/pdf, image/jpeg, image/png
- **Purpose:** Membership-related documents

#### 4. kyc
- **Public:** No
- **File Size Limit:** 2MB
- **Allowed MIME Types:** application/pdf, image/jpeg, image/png
- **Purpose:** KYC documents (PAN, Aadhaar, bank proof)
- **Security:** Consider encryption for sensitive documents

#### 5. payouts
- **Public:** No
- **File Size Limit:** 2MB
- **Allowed MIME Types:** image/jpeg, image/png, application/pdf
- **Purpose:** Payout proof documents (screenshot, bank receipt)

#### 6. testimonials
- **Public:** Yes
- **File Size Limit:** 10MB
- **Allowed MIME Types:** image/jpeg, image/png, image/webp, video/mp4
- **Purpose:** Customer testimonial images/videos

#### 7. invoices
- **Public:** No
- **File Size Limit:** 1MB
- **Allowed MIME Types:** application/pdf
- **Purpose:** Payout invoices (future)

**Step 3: Configure Bucket Policies**

For each bucket, configure RLS policies:

**Public Buckets (treatments, banners, testimonials):**
- **SELECT:** Public (authenticated)
- **INSERT:** Admin/Staff/Content Manager
- **UPDATE:** Admin/Staff/Content Manager
- **DELETE:** Admin/Staff/Content Manager

**Private Buckets (memberships, kyc, payouts, invoices):**
- **SELECT:** Owner (based on user_id) or Admin
- **INSERT:** Admin or Server
- **UPDATE:** Admin
- **DELETE:** Admin

**Example Policy for treatments bucket:**
```sql
-- Allow public read
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'treatments');

-- Allow admin insert
CREATE POLICY "Admin Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'treatments' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff', 'content_manager', 'super_admin')
);
```

---

## 7. Environment Verification

### Verify Environment Variables

**Step 1: Check .env.local**
Open `.env.local` file and verify:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Step 2: Verify Variables in Code**
Open `lib/supabase/env.ts` and verify:
- Variables are being read correctly
- Validation is working
- No missing variables

### Verify Server Client

**Step 1: Create Test API Route**
Create `app/api/test-supabase/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("contact_settings")
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

**Step 2: Test Endpoint**
- Visit: http://localhost:3000/api/test-supabase
- Expected: JSON response with contact_settings data

### Verify Browser Client

**Step 1: Create Test Page**
Create `app/test-client/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function TestClientPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase
      .from("contact_settings")
      .select("*")
      .single()
      .then(({ data }) => setData(data));
  }, []);

  return (
    <div>
      <h1>Test Browser Client</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

**Step 2: Test Page**
- Visit: http://localhost:3000/test-client
- Expected: Contact settings data displayed

### Verify Service Role Safety

**Step 1: Check Imports**
- Open `lib/supabase/admin.ts`
- Verify it has `import "server-only";` at top
- Verify it's only used in server files (marked with "server-only")

**Step 2: Check Client Components**
- Search for `getSupabaseAdminClient` in client components
- Should NOT be imported in any `"use client"` component

### Verify Middleware Session Reading

**Step 1: Check Middleware**
- Open `middleware.ts`
- Verify it uses `createServerClient` from `@supabase/ssr`
- Verify it can read cookies correctly

**Step 2: Test Middleware**
- Visit: http://localhost:3000/admin/dashboard (not logged in)
- Expected: Redirected to `/admin/login`

---

## 8. Build Verification

### Run Production Build

**Step 1: Run Build Command**
```bash
npm run build
```

**Expected Results:**
- ✓ Compiled successfully
- ✓ Linting and checking validity of types
- ✓ Collecting page data
- ✓ Generating static pages
- ✓ Finalizing page optimization
- Build completed successfully

**Common Errors & Solutions:**

- **Error:** "Property 'role' does not exist on type 'never'"
  - **Solution:** Regenerate types (see Section 2)

- **Error:** "Cannot find module '@/lib/supabase/types'"
  - **Solution:** Ensure types.ts file exists in correct location

- **Error:** "Type 'Database' has no exported member"
  - **Solution:** Regenerate types with correct schema

### Verify Build Output

**Step 1: Check Build Folder**
- Check `.next` folder exists
- Check build completed without errors

**Step 2: Test Production Build Locally**
```bash
npm run start
```
- Visit: http://localhost:3000
- Test admin login flow
- Test public pages

### Final Verification Checklist

- [ ] SQL_SETUP.sql executed successfully
- [ ] RLS_POLICIES.sql executed successfully
- [ ] TypeScript types generated successfully
- [ ] No TypeScript errors in codebase
- [ ] First super admin created successfully
- [ ] Admin login working
- [ ] Middleware protecting routes
- [ ] Unauthorized page working
- [ ] Storage buckets created
- [ ] Environment variables configured
- [ ] Server client working
- [ ] Browser client working
- [ ] Service role safe (not exposed to client)
- [ ] Build succeeds without errors
- [ ] Production build test passes

---

## Cleanup Commands (If Needed)

### Drop All Tables (Fresh Start)

```sql
-- WARNING: This deletes all data
-- Run only if you need to start fresh

DROP TABLE IF EXISTS
  activity_logs,
  notifications,
  support_requests,
  contact_settings,
  site_content,
  shipping_orders,
  webhook_logs,
  payments,
  payouts,
  wallet_transactions,
  commissions,
  referral_tree,
  referral_clicks,
  referral_links,
  memberships,
  bookings,
  booking_slots,
  treatments,
  partners,
  admins,
  profiles
CASCADE;

DROP TYPE IF EXISTS
  user_role,
  partner_status,
  kyc_status,
  treatment_type,
  booking_status,
  payment_status,
  membership_status,
  commission_status,
  wallet_transaction_type,
  reference_type,
  payout_status,
  razorpay_status,
  source_type,
  slot_status,
  shipping_status,
  webhook_provider,
  support_status,
  notification_type,
  otp_type;
```

### Drop All RLS Policies

```sql
-- WARNING: This removes all RLS policies
-- Run only if you need to recreate policies

DROP POLICY IF EXISTS "profiles_no_public_access" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
-- ... repeat for all policies
```

---

## Troubleshooting

### Issue: SQL Execution Fails

**Symptom:** SQL Editor shows error
**Solution:**
- Check if tables already exist
- Drop existing tables (see cleanup section)
- Re-run SQL_SETUP.sql

### Issue: Type Generation Fails

**Symptom:** Command fails or types not generated
**Solution:**
- Verify Supabase CLI is installed
- Verify project ID is correct
- Verify you're logged in to Supabase CLI
- Check network connection

### Issue: Login Fails

**Symptom:** Cannot login as admin
**Solution:**
- Verify user was created in auth.users
- Verify profile record exists
- Verify admin record exists
- Verify role is 'super_admin'
- Check email/password are correct

### Issue: Middleware Not Working

**Symptom:** Can access admin routes without login
**Solution:**
- Verify middleware.ts exists in root
- Verify middleware is correctly configured
- Check for conflicting middleware
- Restart dev server

### Issue: Build Fails

**Symptom:** Build shows TypeScript errors
**Solution:**
- Regenerate TypeScript types
- Restart TypeScript server
- Check for missing imports
- Verify all files are saved

---

## Next Steps After Activation

Once activation is complete and verified:

1. **Phase 5:** Implement Admin CRUD Modules
   - Treatments management
   - Bookings management
   - Memberships management
   - Partners management
   - Referrals management
   - Commissions management
   - Payouts management
   - Payments management
   - Content management
   - Settings management

2. **Phase 6:** Implement Partner Dashboard
   - Partner login
   - Partner layout
   - Partner profile
   - Referral link
   - Team management
   - Income tracking
   - Commission history
   - Payout requests
   - Support tickets

3. **Phase 7:** Implement Public Features
   - Booking form integration
   - Membership form integration
   - Razorpay integration
   - Webhook handling
   - Email notifications

---

**Activation Guide Complete.**
