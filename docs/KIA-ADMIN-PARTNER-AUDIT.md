# KIA Skin Care Admin and Partner Audit

Date: 2026-07-10

## Scope

This audit covers the public website, admin panel, partner portal, Supabase wiring, booking flow, referral flow, commission and payout flow, reporting, environment configuration, and operational reset readiness.

The project is an existing Next.js App Router application. This document does not recommend a rebuild. It records the current architecture, the production-hardening fixes already made, and the remaining controlled steps before a fresh client handover.

## Architecture Summary

- Framework: Next.js App Router with React.
- Backend: Supabase database, auth, storage, and RLS.
- Public site routes: home, about, contact, membership, referral, treatments, treatment detail, thank-you.
- Admin routes: dashboard, bookings, commissions, contact, content, FAQs, franchise leads, KYC, login, media, memberships, partners, payments, payouts, referrals, reports, settings, health, testimonials, treatments.
- Partner routes: dashboard, commissions, direct team, income, KYC, new membership, payouts, profile, referral link, support, team.
- Public partner auth routes: login, forgot-password, reset-password.
- Health APIs: `/api/health`, `/api/health/supabase`.

## Supabase Client and Auth Review

- Browser client uses the public anon key only.
- Server request client uses the public anon key with SSR cookies.
- Service-role client is isolated in server-only Supabase helper code and is used by server actions that require admin auth operations.
- Middleware protects `/admin/*` and `/partner/*` routes.
- Admin access is limited to profile roles `super_admin` and `admin`.
- Partner access is limited to profile role `partner`.
- Public auth pages remain accessible without a session.
- Legacy OZO referral/domain normalization exists in middleware for backward compatibility.

Security note: no service role usage was found in browser components. Keep service role variables server-only and never prefix them with `NEXT_PUBLIC_`.

## Verified Schema Facts

The active application has been aligned to these verified schema facts:

- `memberships`: `membership_status`, `referral_code`, `sponsor_id`, `is_active`
- `partners`: `partner_code`, `sponsor_id`, `wallet_balance`, `total_earnings`, `paid_earnings`, `status`
- `commissions`: `percentage`, `amount`, `status`, `level`, `source_type`
- `payouts`: `gross_amount`, `deduction_rate`, `deduction_amount`, `net_amount`, `status`

Static scan result:

- No active app query was found using `memberships.status`.
- No active app query was found using `memberships.partner_code`.
- No active app query was found using `commissions.deduction_rate`.
- Partner code is correctly read from `partners.partner_code`.
- Membership status is correctly read from `memberships.membership_status`.
- Payout deduction is correctly handled on `payouts.deduction_rate`, not commissions.

## Data Source Alignment

Treatments:

- Admin treatments, public treatment pages, and booking selection use the same `treatments` source.
- The final five treatments are seeded by `supabase/MIGRATION_FINAL_TREATMENTS_PAYOUT_SUMMARY_FIX.sql` and related final treatment upsert SQL.
- Admin treatments support add, edit, delete/soft-delete, activate, and feature controls.
- Booking validation checks active treatment records and accepts kit/service style treatment records.

Bookings:

- Booking actions validate active treatment by `treatment_id` and preserve the selected treatment name and amount.
- Bookings store customer details, treatment reference/name/price, partner/referral code, pending booking status, and payment-ready fields.
- Razorpay is intentionally not integrated yet.

Payouts:

- Admin payouts are built from real payout rows and partner income summaries.
- If a partner has earnings but no payout request yet, the admin payout page can still show an available/pending payout summary.
- Formula is consistent:
  - Gross Income = Membership Income + Product Income + Bonus Income
  - Deduction = Gross Income x 15%
  - Net Payable = Gross Income - Deduction
  - Pending Payout = Net Payable - Paid Amount

## Referral System Review

The intended referral relationship fields are preserved:

- `partners.sponsor_id`
- `memberships.sponsor_id`
- `memberships.referral_code`
- `partners.partner_code`
- referral tree rows where present

Expected behavior:

- When Partner A refers Partner B, Partner B appears in Direct Team and My Team immediately while pending.
- Admin approval changes status to active without breaking sponsor linkage.
- Approved partners remain visible in team screens.
- Team and hierarchy screens must not filter out approved members by mistake.

## Commission and Wallet Review

Commission data is driven by `commissions` and partner wallet fields.

The code now treats commission deductions as payout-level math, not commission-row schema. Admin dashboard, partner dashboard, income page, payouts, and reports should use the same gross/deduction/net formula.

Wallet lifecycle:

- Commission rows create income.
- Partner wallet fields expose available and paid values.
- Payout request uses available balance.
- Admin approval/mark-paid updates payout state and paid totals.
- Wallet transactions are used as the ledger where available.

## Admin Panel Coverage

Verified/admin-managed areas:

- Dashboard
- Treatments
- Bookings
- Membership requests
- Partners
- Referrals
- Commissions
- Payouts
- Reports
- Content
- Contact
- FAQs
- Testimonials
- Media
- KYC
- Settings
- Health checks

Editable content coverage:

- Homepage and general content through `site_content`
- Treatments through `treatments`
- FAQs through `faqs`
- Testimonials through `testimonials`
- Contact settings through `contact_settings`
- Commission and membership-related settings through `commission_settings` and `system_settings` where present

## Partner Portal Coverage

Verified partner areas:

- Dashboard
- VIP partner card
- New membership
- Direct team
- My team
- Income
- Commissions
- Payout requests
- KYC/profile/bank details
- Referral link
- Support

The old sidebar card should stay removed from the partner shell. The VIP card belongs on the dashboard and must show name, partner ID, joining date, expiry, wallet, status, and KYC status.

## Operational Data Classification

Preserve for handover:

- Schema and migrations
- Treatments and kit catalog
- Site content
- Contact settings
- FAQs
- Testimonials
- Commission settings
- System settings
- Media assets
- Branding configuration
- Admin roles/accounts unless explicitly replaced

Reset for fresh start:

- Test bookings
- Test memberships
- Partner accounts and partner operational profiles
- Referral clicks and referral tree rows
- Commissions
- Wallet transactions
- Payouts
- Payments and webhook logs
- Notifications and activity logs
- Daily partner stats
- Support requests and franchise leads if they were only test data

Auth user deletion cannot be safely performed by SQL alone. If Supabase Auth users must be removed, use a server-side Admin API script after backup and explicit project confirmation.

## Risks Found

- Resetting operational data is destructive and must be guarded by backup and project confirmation.
- Some older SQL files are historical and should not be re-run blindly, especially `FIX_RLS_RECURSION.sql`, which disables RLS on many tables.
- Public read policies are needed for public content tables, while admin writes must remain protected.
- If Auth users are deleted separately from app rows, profile/partner consistency must be verified after the reset.
- Google Sheet sync environment values must use placeholders in examples and real values only in deployment secrets.

## Current Status

The app code has been hardened against the verified schema facts. Treatment image management has also been moved to a server-side save flow with local multi-image upload, primary image selection, image ordering, alt text, cache invalidation, and booking price snapshots.

Production data handover status:

- Treatment image migration applied.
- Production hardening migration applied/verified.
- Pre-reset snapshot completed.
- Operational reset completed.
- Auth cleanup completed manually by project owner.
- Auth cleanup script intentionally not executed.
- 2 approved Auth users remain.
- No further destructive action is required.

Read-only zero-state verification:

- Operational partner/member/booking/referral/commission/payment/payout/wallet/franchise data is zero.
- Non-admin profiles are zero.
- Treatments, treatment images, website content, FAQs, testimonials, contact settings, commission settings, and system settings are preserved.

Access note:

- Admin account has a valid `profiles.role = admin`.
- Client Auth account exists but currently has no app profile role row. Assigning that role is non-destructive but permission-sensitive and should be done only after explicit approval of the intended role.
