# KIA Skin Care — Admin Panel & Website Audit

**Date:** 2026-06-22
**Scope:** Full-stack audit of the Next.js 15 + Supabase application (website + admin + partner portal) prior to production-hardening changes.
**Guiding rule:** No data loss. Audit before change. Migration-safe SQL only.

---

## 1. Architecture Overview

- **Framework:** Next.js 15 (App Router) + React 18, TypeScript, TailwindCSS.
- **Data:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`). Server actions in `lib/actions/*`.
- **Route groups:**
  - `app/(site)` — public website (home, treatments, about, contact, membership/referral, thank-you).
  - `app/(admin)` — `/admin/*` (CMS + CRM) and `/partner/*` (partner portal).
  - `app/(partner-public)` — partner login/forgot/reset.
- **Auth/routing:** `middleware.ts` protects `/admin` (roles `super_admin`, `admin`) and `/partner` (role `partner`) via `profiles.role`. Handles referral-code capture (`?ref=` and `/KIA####` path) into the `kia_referral_code` cookie, plus legacy domain → official domain redirects.
- **Supabase clients:** `lib/supabase/server.ts` (anon SSR + service-role), `client.ts` (browser), `admin.ts`. Service-role is used inside server actions only (correct — not exposed to frontend).

---

## 2. CRITICAL FINDINGS (data-loss / correctness risks)

### C1. Hard delete of treatments cascades to bookings — DATA LOSS
- `bookings.treatment_id` references `treatments(id)` with **`ON DELETE CASCADE`** (`SQL_SETUP.sql`).
- `deleteTreatment()` in `lib/actions/treatments.ts` performs a **hard `DELETE`**.
- **Impact:** Deleting any treatment silently deletes every booking attached to it (and via further cascades, related partner sales).
- **Fix:** Convert `deleteTreatment` to soft delete (`active=false, is_active=false, deleted_at=now()`); never hard-delete treatments referenced by bookings. Add a confirm dialog.

### C2. Hard delete of bookings — DATA LOSS
- `deleteBooking()` performs a hard `DELETE`. Bookings carry financial history (commissions reference `source_id`). Should be soft-deleted/archived.

### C3. Schema drift — `SQL_SETUP.sql` is NOT the live schema
- The live DB has been evolved by ~15 separate migration files. `SQL_SETUP.sql` (v2.0 baseline) is missing many columns/tables that the application code depends on. Re-running it would **not** reproduce production.
- Tables created only in later migrations: `testimonials`, `faqs`, `franchise_leads`, `partner_sales`, `partner_membership_requests` (referenced by `memberships.ts`), KYC fields.
- There is no single canonical/ordered migration set. **Risk:** future setup/restore will diverge from prod.

### C4. `site_content` has dual, conflicting column sets
- Baseline `site_content` defines `content_key TEXT NOT NULL`, `content_value JSONB NOT NULL`, `page`, `section`.
- Later migration (`MIGRATION_HANDOVER_PAYMENT_PAYOUT_CONTENT_READY.sql`) adds `key_name`, `value`, `value_type`, `display_order`.
- Application code (`lib/actions/content.ts`, `lib/data/public.ts`) reads/writes **`key_name`, `value`, `display_order`** only.
- **Risk:** Any new `site_content` row inserted by the admin without `content_key`/`content_value` will fail the legacy `NOT NULL` constraints. CMS "add new field" is therefore unsafe until the legacy columns are made nullable or dropped.

### C5. Commission percentages hardcoded in two places, diverging from `commission_settings`
- `lib/actions/referral-tracking.ts` hardcodes `{1:6, 2:3, 3:1.7, 4:1.2}`.
- `lib/actions/bookings.ts` hardcodes `COMMISSION_RATE = 6` for the `partner_sales.commission_amount` preview.
- `commission_settings` table (CMS-editable L1–L4) is **not read** by the generation logic.
- **Impact:** Editing commission % in admin has no effect on actual commission generation. Values can silently diverge.

---

## 3. Section-by-Section Findings

### A) Website Content CMS — PARTIAL
- `content.ts` exposes only `getSiteContent`, `updateSiteContent(id, value)`, `updateSiteContentBulk`. It is **edit-only**: cannot create new sections/fields, cannot delete, has no per-type handling (text/textarea/rich/image/gallery/url/toggle/number/json).
- `updateSiteContentBulk` loops row-by-row with no transaction (partial-failure leaves inconsistent state).
- Frontend fetch (`getPublicSiteContent`) keys by `key_name` and applies legacy-branding cleanup. No cache tags; relies on `revalidatePath`.
- Many sections are still hardcoded in `lib/site.ts` (hero, trust badges, referral levels, sales bonuses, nav, address) and `lib/treatments/catalog.ts`. Frontend uses these as fallbacks.
- **Gap vs. requirement A:** No editing for hero/about/franchise/banners/footer/SEO meta as structured fields; no field types; no validation/empty/loading/toast contract enforced centrally.

### B) Treatments / Products — PARTIAL
- `createTreatment`/`updateTreatment` handle only: `title, slug, type, price, tagline, description, benefits, duration, sessions, image, gallery, featured, active, requires_slots, available_cities`.
- **Missing fields** that exist in DB and are used by the public site: `kit_name, subtitle, overview, price_label, unit, who_for, safety, faqs, process/process_steps, badge, icon, tone, image_alt, before_image_url, after_image_url, cta_text, sort/display order, SEO`.
- `gallery`/`benefits`/`available_cities` parsed via `JSON.parse` without try/catch → a malformed field throws and aborts the save.
- Hard delete (see C1). No activate/deactivate confirmation, no sort-order UI.
- Public fetch (`getPublicTreatments`) is **locked to `treatmentKitSlugs`** (the 5 known kits) and falls back to the static catalog — newly created treatments outside those slugs won't appear on the homepage flow.

### C) Bookings — MOSTLY OK, gaps
- `getBookings` joins `treatments(title)`, returns all (no pagination/filter server-side).
- `updateBookingStatus` / `updateBookingPaymentStatus` correctly (re)generate commissions via `generateBookingCommissions` and keep `partner_sales` in sync; they defensively retry when optional columns are absent (sign of schema uncertainty).
- Hard delete (C2). Stats source needs verification on dashboard (see K).

### D) Referral System — STRONG core, config drift
- `generateBookingCommissions`: builds L1 from `referred_by` (or resolves by code), walks `referral_tree` (fallback to sponsor chain) up to L4, enforces partner `active` + membership-not-expired, dedupes via pre-check **and** DB unique `(source_type, source_id, partner_id, level)`, credits wallet + writes `wallet_transactions`, rolls back commission row if wallet update fails. This is solid.
- **Issues:**
  - Percentages hardcoded (C5), not from `commission_settings`.
  - Commissions are inserted as `status='approved'` and auto-credited — there is no `pending → approved` admin gate at generation time (requirement C/D implies status workflow incl. `pending`).
  - Wallet credit + commission insert are not in a single DB transaction (app-level compensation only).
  - Network/tree search UI completeness, payouts page behavior — to be verified against `referrals.ts` / `payouts.ts` during implementation.

### E) KYC / Membership / Partner Approval — needs verification
- `memberships.ts` (19.5KB) handles approval → partner creation/linking; references `partner_membership_requests`. Must confirm: reject preserves record (no silent delete), admin notes persist, Supabase Auth user creation/password reset is safe and never exposes passwords. To verify in implementation phase.

### F) Admin UI/UX — to be assessed
- `components/admin/Sidebar.tsx` + `components/admin/sidebar/` exist. Reported double-scroll/overflow and non-responsive tables to be confirmed and fixed (desktop table → mobile cards, filters, pagination, confirm-before-destroy, empty/error states).

### G) Real-time / Cache — PARTIAL
- Mutations use `revalidatePath` across affected routes (good baseline). No React Query/SWR; no Supabase realtime subscriptions. Some sections still read static data (`lib/site.ts`).

### H) Social Floating Icons — PARTIAL
- WhatsApp float exists. Instagram/Facebook to be added and all three sourced from contact/social CMS (`contact_settings` / `site_content`), which `getPublicContactSettings` already exposes (`instagram`, `facebook`, `whatsapp`).

### I) Media Library — BASIC, OK
- `storage.ts`: upload (≤8MB, image/* only), list (cap 100, no pagination/folder filter), delete by path/url. Bucket `media` must exist and be public (auto-create not implemented; error message guides manual creation). No server-side compression (`sharp` is a dependency but unused here).

### J) Supabase SQL / Migrations — FRAGMENTED
- Strengths present: enums, `updated_at` triggers, `prevent_sponsor_change` lock, `log_activity` audit triggers, commission unique constraint, sensible indexes, default seed rows.
- Gaps: no consolidated migration; legacy `site_content` NOT NULL columns (C4); commission generation not driven by settings (C5); `media_library` / `admin_activity_logs` table names from the spec differ from existing (`activity_logs`); RLS to be re-verified (`RLS_POLICIES.sql` + `FIX_RLS_RECURSION.sql` indicate prior recursion issues).

### K) Dashboard Reporting — to be verified
- Requirement: real Paid Booking Sales, L1–L4 income, wallet balance, pending/paid payouts, totals, pending KYC/memberships, working date filters. Current dashboard data source to be confirmed and any hardcoded values removed.

---

## 4. Inventory (observed)

**Tables (baseline + migrations):** `profiles, admins, partners, treatments, booking_slots, bookings, memberships, referral_links, referral_clicks, referral_tree, commissions, wallet_transactions, payouts, payments, webhook_logs, shipping_orders, commission_settings, system_settings, daily_partner_stats, otp_logs, site_content, contact_settings, support_requests, notifications, activity_logs, testimonials, faqs, franchise_leads, partner_sales, partner_membership_requests`.

**Admin routes present:** dashboard, content, treatments, testimonials, faqs, bookings, franchise-leads, memberships, partners, referrals, commissions, kyc, payouts, reports, media, contact (contact-settings), settings, payments, system-health.

**Key server actions:** `bookings, treatments, content, contact, faqs, testimonials, memberships, partners, referrals, referral-tracking, commissions, commission-settings, payouts, payments, kyc, franchise-leads, storage, system-settings, sync, partner-login, referral-clicks`.

---

## 5. Recommended Fix Order (safety-first)

1. **Migration 1 (non-destructive, additive):** make legacy `site_content.content_key/content_value` nullable (fix C4); add any missing treatment/SEO/sort columns `IF NOT EXISTS`; add `treatment_images` table; ensure unique constraints (`partner_code`, `slug`, commission tuple) and search indexes; add `updated_at` triggers where missing. No drops.
2. **Code C1/C2:** convert treatment & booking deletes to soft delete + confirmations (immediate data-loss protection).
3. **Code C5:** drive commission percentages from `commission_settings` with safe fallback to current constants.
4. **CMS (A) + Treatments (B):** full field-type editing and full CRUD with multi-image upload.
5. **Bookings/Dashboard (C/K):** real stats, filters.
6. **UI/UX (F), Social (H), Media (I), Realtime (G).**
7. **RLS/views (J), KYC/membership (E) verification + hardening.**
8. **Testing (L):** build/lint, route walkthrough, fix console/Supabase errors, write `KIA_ADMIN_FINAL_CHECKLIST.md`.

> All migrations will be additive and idempotent (`IF NOT EXISTS` / guarded `DO $$`). No table/column will be dropped without a backup SQL snapshot step. Existing IDs, partner codes, and treatment slugs are preserved.
