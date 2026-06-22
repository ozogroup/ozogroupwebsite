# KIA Skin Care — Production Hardening Checklist

**Companion to:** `docs/KIA_ADMIN_AUDIT.md`
**Status legend:** ✅ done · 🟡 partial · ⬜ pending

---

## 1. SQL — run order (Supabase SQL Editor)

> All migrations are additive + idempotent. Take a Supabase backup first (Dashboard → Database → Backups). The migration also writes lightweight `_bak_20260622_*` snapshot tables.

**Run in this exact order:**

1. **`supabase/MIGRATION_PRODUCTION_HARDENING_2026_06_22.sql`** — run this first. It:
   - Snapshots `site_content`, `treatments`, `commission_settings` into `_bak_20260622_*`.
   - Fixes `site_content` legacy `content_key/content_value` NOT NULL (unblocks CMS add-field).
   - Adds all missing `treatments` columns (kit_name, subtitle, overview, who_for, safety, faqs, process, gallery, before/after image, cta_text, sort_order, SEO, etc.).
   - Creates `treatment_images` and `media_library` tables.
   - Adds `updated_at` triggers for `testimonials`, `faqs`, `franchise_leads`, `partner_sales`, `treatment_images`.
   - Adds `get_active_commission_percentages()` helper + reporting views (`v_admin_booking_sales`, `v_admin_commission_by_level`, `v_admin_wallet_summary`, `v_admin_payout_summary`).
   - Adds public-read RLS for content tables + admin-only write RLS for storage `media` bucket.
   - Creates the `media` storage bucket (public) and its policies.
   - Adds search/filter indexes.

2. **`supabase/MIGRATION_REFERRAL_WORKFLOW_HARDENING_2026_06_22.sql`** — run this second. It:
   - Adds unique index `uq_commissions_booking_partner_level` to prevent duplicate commission rows for the same booking + partner + level.
   - Adds performance indexes for commission status filtering and partner commission queries.
   - Adds check constraint `ck_commissions_status` to enforce valid status values (pending, approved, paid, rejected).

> The older scattered SQL files in `supabase/` remain for history; they are superseded by the above and are safe to leave un-run (all guarded by `IF NOT EXISTS`).

### Manual Supabase steps (UI)
- Confirm the `media` storage bucket exists and is **public** (the migration creates it; verify under Storage).
- No password/keys are exposed: service-role key stays server-side (used only in `lib/actions/*`). Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in server env, never in `NEXT_PUBLIC_*`.

---

## 2. Code changes completed this pass

- ✅ **C1 — Treatment delete is now soft-delete** (`lib/actions/treatments.ts deleteTreatment`). Prevents `ON DELETE CASCADE` from destroying bookings.
- ✅ **C2 — Booking delete is now soft-delete** (`lib/actions/bookings.ts deleteBooking`); `getBookings` excludes archived (`deleted_at IS NULL`).
- ✅ **C5 — Commission % now read from `commission_settings`** with safe fallback:
  - `lib/actions/referral-tracking.ts` → `getCommissionPercentages()` drives L1–L4 generation.
  - `lib/actions/bookings.ts` → `getLevel1CommissionRate()` drives the booking-time L1 estimate.
- ✅ **D — Commission status workflow hardened** — Enforces strict lifecycle (pending → approved → paid):
  - `lib/actions/referral-tracking.ts` — Commissions generated as 'pending' without immediate wallet credit.
  - `lib/actions/commissions.ts` — Wallet-aware approve/reject/pending functions with safe `updateCommissionStatus` router. Wallet credited only on approval, reversed on rejection.
  - `lib/actions/payouts.ts` — On payout paid, marks approved commissions as paid FIFO up to payout amount.
  - `app/(admin)/partner/income/page.tsx` — Pending income counts only 'pending' commissions.
  - `app/(admin)/admin/dashboard/page.tsx` — Level X Income counts only 'approved' and 'paid' commissions.
  - `app/(admin)/partner/dashboard/page.tsx` — Earnings stats aligned: pending = 'pending', paid = 'paid'.
- ✅ **Treatments admin visibility** — admin list no longer locked to the 5 kit slugs; shows all non-deleted treatments ordered by `sort_order`, so newly added treatments are visible/manageable.
- ✅ **H — Floating social icons** — `components/WhatsAppFloat.tsx` now renders WhatsApp + Instagram + Facebook, sourced from `getPublicContactSettings()` (CMS-driven), mobile-responsive, IG/FB only shown when a URL is set.

**Verification:** `npx tsc --noEmit` → exit 0 (clean). `npm run build` → exit 0 (successful production build).

---

## 3. Status by requirement area

| Area | Status | Notes |
|---|---|---|
| Audit report | ✅ | `docs/KIA_ADMIN_AUDIT.md` |
| Safety migration (J, partial) | ✅ | `MIGRATION_PRODUCTION_HARDENING_2026_06_22.sql` |
| C1/C2 data-loss deletes | ✅ | soft-delete everywhere |
| C5 commission config | ✅ | settings-driven |
| B) Treatments CRUD | ✅ | Full field set now editable (who_for, process steps, FAQs, before/after images, SEO, sort_order) + multi-image gallery + soft delete. Admin list **and** public `getPublicTreatments` unlocked from the 5-kit filter, so new treatments are visible. `treatment_images` table available for future normalized galleries (gallery JSON already works). |
| H) Social floats | ✅ | WhatsApp + IG + FB from CMS |
| A) Website Content CMS | ✅ | **Re-assessed:** the admin page (`admin/content/page.tsx`) already provides section groups, field types (text/textarea/image_url/image_gallery/link), add/edit/delete, search, toasts, empty/loading states, writing directly via the browser client. The only blocker was the DB constraint (C4) — now fixed by the migration, so "Add Content" inserts succeed. (`lib/actions/content.ts` server actions are largely unused by this page.) |
| C) Bookings admin | 🟡 | Soft-delete + archived-list filter done; data is real (force-dynamic). Pending (optional): server-side filters/pagination, explicit status workflow review. |
| D) Referral system | ✅ | Engine strong + settings-driven; commission status workflow hardened (pending→approved→paid), wallet-aware approval/rejection, FIFO payout marking, duplicate prevention via unique index, all dashboards aligned. |
| E) KYC/membership/approval | ⬜ | Needs verification of reject-preserves-record, admin notes persistence, Auth-safe partner creation/password reset. |
| F) Admin UI/UX | ⬜ | Sidebar double-scroll, responsive table→card, confirmations/empty/error states. |
| G) Realtime/cache | ✅ | **Re-assessed:** `app/(site)/layout.tsx` is `export const dynamic = "force-dynamic"`, so the public site re-fetches from Supabase on every request — admin changes appear live on refresh with no stale cache. Admin/partner layouts are also force-dynamic. |
| I) Media library | 🟡 | Upload/list/delete exist (≤8MB, image/*); pending `media_library` catalog wiring + compression (`sharp`). |
| K) Dashboard reporting | ✅ | **Re-assessed:** `admin/dashboard/page.tsx` already computes Paid Booking Sales, L1–L4 income, wallet balance, pending/paid payouts, partner-wise sales, pending KYC, expired memberships, top treatment/partner from real Supabase data with a working `DateRangeFilter` (`resolveDateRange`). Optional SQL `v_admin_*` views are available if you prefer DB-side aggregation. |
| L) Testing/checklist | 🟡 | Type-check clean; this checklist created. Full route walkthrough pending. |

---

## 4. Recommended next steps (in order)
1. **Apply the SQL migrations in Supabase** in this exact order:
   - `MIGRATION_PRODUCTION_HARDENING_2026_06_22.sql`
   - `MIGRATION_REFERRAL_WORKFLOW_HARDENING_2026_06_22.sql`
   - Verify the `media` bucket is public.
2. Smoke-test in admin: add a treatment → confirm it appears on the website; add a content field → confirm it saves; toggle a treatment off → confirm it hides; verify WhatsApp/IG/FB floats.
3. Test referral/commission flow: create booking → confirm commission generated as 'pending' → approve commission → verify wallet credited → reject commission → verify wallet reversed → payout paid → verify commissions marked paid FIFO.
4. Remaining optional polish: Admin UI/UX responsive pass (F), KYC/membership reject-preserves-record verification (E), media-library catalog + image compression (I).
5. Full route walkthrough; fix any console/Supabase errors; update this checklist.
