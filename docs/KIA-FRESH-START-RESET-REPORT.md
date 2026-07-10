# KIA Skin Care Fresh Start Reset Report

Date: 2026-07-10

## Reset Status

Status: completed on project `clagbybuxaumyroknjai`.

The project owner confirmed these live steps are complete:

- Applied `supabase/MIGRATION_TREATMENT_IMAGES_STORAGE_2026_07_10.sql`
- Applied/verified `supabase/MIGRATION_FRESH_START_HARDENING_2026_07_10.sql`
- Ran `supabase/scripts/KIA_PRE_RESET_SNAPSHOT_2026_07_10.sql`
- Ran `supabase/scripts/KIA_OPERATIONAL_RESET_2026_07_10.sql`
- Manually removed all old/test Supabase Auth users
- Preserved only 2 approved Auth accounts

Auth cleanup script status: intentionally not executed.

## Files Prepared

- `supabase/scripts/KIA_PRE_RESET_SNAPSHOT_2026_07_10.sql`
- `supabase/scripts/KIA_OPERATIONAL_RESET_2026_07_10.sql`
- `supabase/scripts/KIA_QA_CLEANUP_2026_07_10.sql`
- `supabase/MIGRATION_FRESH_START_HARDENING_2026_07_10.sql`
- `supabase/MIGRATION_TREATMENT_IMAGES_STORAGE_2026_07_10.sql`
- `scripts/cleanup-kia-test-auth-users.ts`

## Completed Operator Checklist

1. Supabase project reference confirmed.
2. Pre-reset snapshot completed.
3. Operational reset completed.
4. Test Auth users manually removed by project owner.
5. Auth cleanup script intentionally skipped.
6. Post-reset read-only verification completed.

## Data Preserved

The reset script intentionally preserves:

- Schema
- RLS policies
- Admin and super-admin profile rows
- Treatments and kit catalog
- Treatment images
- Site content
- Contact settings
- FAQs
- Testimonials
- Media library rows and storage assets
- Commission settings
- System settings
- Branding and content configuration

## Data Reset

The operational reset script deletes, where tables exist:

- `activity_logs`
- `notifications`
- `daily_partner_stats`
- `otp_logs`
- `webhook_logs`
- `payments`
- `shipping_orders`
- `wallet_transactions`
- `payouts`
- `commissions`
- `earnings`
- `partner_sales`
- `referral_tree`
- `referral_clicks`
- `referral_links`
- `bookings`
- `booking_slots`
- `memberships`
- `support_requests`
- `franchise_leads`
- `partner_kyc`
- `partners`
- non-admin/non-super-admin `profiles`

## Backup Strategy

`KIA_PRE_RESET_SNAPSHOT_2026_07_10.sql` creates timestamped backup tables in `public` with the prefix `_kia_reset_backup_20260710_`.

These backup tables are intended as a rollback aid for app tables. They do not back up Supabase Auth users, storage binaries, or external integrations. Use the Supabase dashboard backup for full database recovery.

## Rollback Notes

If the reset is run by mistake:

1. Stop application writes.
2. Use Supabase Dashboard backup restore for complete recovery.
3. For partial app-table recovery, restore from `_kia_reset_backup_20260710_*` tables after reviewing foreign-key order.
4. Recreate Auth users only through Supabase Auth Admin API if they were deleted separately.

## Auth User Warning

SQL can delete app rows such as `profiles`, `partners`, and `memberships`. It must not be treated as a complete Auth reset. Supabase Auth users live in the `auth` schema and should be managed through authenticated server-side admin tooling only.

## Execution Evidence

Destructive reset was executed by the project owner in Supabase SQL Editor, not from this workspace.

Post-reset read-only verification timestamp: 2026-07-10T10:22:15.546Z.

Verified counts:

- Partners: 0
- Memberships: 0
- Bookings: 0
- Referral tree: 0
- Referral clicks: 0
- Referral links: 0
- Commissions: 0
- Payments: 0
- Payouts: 0
- Wallet transactions: 0
- Franchise leads: 0
- Non-admin profiles: 0
- Treatments: 7
- Treatment images: 8
- Site content: 13
- FAQs: 6
- Testimonials: 6
- Contact settings: 1
- Commission settings: 1
- System settings: 1

Auth state:

- Approved Auth users remaining: 2
- Old/test Auth users remaining: 0
- Auth cleanup script executed: no
- Auth cleanup completed manually by project owner: yes

Access note:

- The existing admin Auth account has a matching `profiles` row with role `admin`.
- The approved client Auth account exists but does not currently have a matching app `profiles` role row. Creating that row is a production permission change and requires explicit project-owner approval.

Add execution evidence here after approval:

- Supabase project reference:
- Backup timestamp:
- Snapshot script timestamp:
- Reset script timestamp:
- Operator:
- Before/after row-count output:
- Post-reset QA result:
