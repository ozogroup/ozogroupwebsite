# KIA Skin Care — Verified Financial Architecture Audit

Date: 2026-07-15
Branch: `claude/kia-financial-system-repair` (created from `codex/kia-production-launch-repair`)
Production deploy: not performed. No SQL run against any live database during this audit.

This document supersedes `docs/KIA-BUSINESS-ENGINE-AUDIT-2026-07-14.md` as the current source of truth.
It verifies that prior audit's claims against the actual repository, and against the SQL files that
prior audit itself says were only *prepared*, not applied ("These files are prepared for review only.
They were not applied by Codex.").

## 0. How this audit was produced

Read directly: `lib/actions/{bookings,commissions,payouts,referral-tracking}.ts`, `lib/db/*`,
`lib/supabase/server.ts`, `middleware.ts`, `package.json`, `.env.example`, `supabase/ACTIVATION_GUIDE.md`,
all prior `docs/KIA-*` and `docs/KIA_*` audits, git log/diff for the current branch.

Delegated (and independently cross-checked) two research passes: one over every file under `supabase/`
(migrations, RPCs, RLS policies, triggers), one over `lib/actions/{kyc,memberships,partners,
commission-settings,system-settings}.ts`, `lib/auth/*`, and every admin/partner financial page.

No production database was queried. Every "is X actually enabled in production" question below is
answered from static SQL text only and is flagged as **UNVERIFIED-LIVE** where it matters — Phase 2
includes a read-only diagnostic script to resolve these against the real database safely.

## 1. Confirmed business decisions (from user, 2026-07-15)

1. **Membership commission**: a flat **₹500** commission is credited to the **direct sponsor only**
   (Level 1, no 2/3/4-level payout) when admin confirms/approves a new paid membership. This is a new
   feature — no such logic exists anywhere in the current app or SQL.
2. **Partner status `approved` → `active`**: normalize automatically. All partners currently sitting at
   `status = 'approved'` will be bulk-updated to `status = 'active'` by the repair SQL.
3. **Wallet/ledger mismatches**: auto-correct. Any partner whose `wallet_balance`/`total_earnings`/
   `paid_earnings` disagree with what the `commissions`+`payouts` ledger implies will be overwritten to
   match the ledger, after a full snapshot backup and a logged exception row per correction.

## 2. Current verified data flow

```
Membership registration (lib/actions/memberships.ts createMembership)
  -> partners row (status='pending'), memberships row (status='pending', payment_status='pending')
  -> sponsor_id resolved from submitted referral_code, self-referral blocked by email match
  -> admin marks membership payment_status='paid' (manual; no live gateway)
  -> admin approval calls RPC kia_approve_paid_membership(membership_uuid)
       - SECURITY DEFINER, admin/service-role gated, row-locks membership+profile+partner
       - sets partners.status='active', 1yr membership_expires_at, profiles.role='partner'
       - seeds referral_tree rows (levels 1-4) inline in SQL
       - NO JS fallback exists if this RPC is missing/broken -> approval hard-fails
       - does NOT create any commission row (membership commissions do not exist yet)

Booking (lib/actions/bookings.ts createBooking)
  -> referral attribution precedence: submitted referral_code > kia_referral_code cookie >
     ozo_referral_code cookie > logged-in user's own partner code (fallback only)
  -> booking row created with referred_by/referral_code/partner_code, payment_status='pending_payment'
  -> partner_sales mirror row inserted (commission_amount always null — compatibility only)
  -> admin marks payment paid + status confirmed/completed (manual; no live gateway)
       -> generateBookingCommissions (lib/actions/referral-tracking.ts) fires:
            1. tries RPC kia_generate_booking_commissions(booking_uuid) first
            2. falls back to JS logic if RPC missing/errors
            Both paths: gross amount base (no discount subtraction), walk sponsor chain
            levels 1-4 at 6%/3%/1.7%/1.2% (from commission_settings, else hardcoded default),
            skip the source (referring) partner itself, require each ancestor status='active'
            + membership not expired, insert commissions rows as 'pending'
  -> admin approves a pending commission (lib/actions/commissions.ts approveCommission)
       -> JS reads partners.wallet_balance, computes new balance, writes it back, inserts
          wallet_transactions row — THREE separate unprotected round trips, no row lock,
          no DB transaction, no RPC
  -> admin marks a payout 'paid' (lib/actions/payouts.ts updatePayoutStatus)
       -> tries RPC process_partner_payout first (this one IS properly locked/atomic/idempotent)
       -> falls back to unprotected JS read-then-write if the RPC errors
       -> on success, markApprovedCommissionsPaid walks the partner's oldest 'approved'
          commissions FIFO up to the payout's gross amount, stamps them 'paid' + payout_id
```

## 3. Findings

Severity follows the audit brief: BLOCKER blocks launch outright, CRITICAL is a real money-correctness
or security gap, HIGH should be fixed before real partner payouts happen, MEDIUM/LOW are hardening.

### BLOCKER

**B1. Financial-table RLS may currently be disabled in production — UNVERIFIED-LIVE.**
`supabase/FIX_RLS_RECURSION.sql` (undated) runs `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` on
`profiles, admins, partners, treatments, testimonials, faqs, site_content, contact_settings, bookings,
memberships, commissions, payouts`. Its own footer calls this a dev-only quick fix. No later migration
in `supabase/` re-enables RLS on `commissions`, `payouts`, `partners`, `wallet_transactions`, `bookings`,
`memberships`, or `admins` — only `profiles`, `contact_settings`, and public content tables are
confirmed re-enabled later. **If this file was ever run against the live database, every financial
table is currently readable/writable by anyone holding the public anon key**, with only application
code (not the database) enforcing access control. This cannot be determined from source files — Phase
2's `01_READ_ONLY_LIVE_DIAGNOSTICS.sql` checks `pg_class.relrowsecurity` for every financial table as
the first thing it does, before anything else runs.

**B2. Membership approval has no fallback and depends on a migration of unconfirmed live status.**
`kia_approve_paid_membership` is the only code path that activates a partner, assigns `partners.status
='active'`, and seeds `referral_tree`. `lib/actions/memberships.ts approveAndCreatePartner` calls this
RPC and, unlike the booking-commission path, has **zero JS fallback** — if the RPC doesn't exist in the
live database (plausible, since the prior audit states its own migration "were not applied by Codex"),
every membership approval fails and **no new partner can ever be onboarded**. This is fixed in Phase 3
by adding a JS fallback mirroring the RPC's logic, and Phase 2 ships the RPC idempotently regardless.

### CRITICAL

**C1. Commission approve/reject has no atomicity at all — highest financial-integrity risk in the app.**
`lib/actions/commissions.ts approveCommission`/`rejectCommission`/`creditWallet`/`reverseWallet`
(commissions.ts:44-111, 198-234) read `partners.wallet_balance`, compute a new value in JS, and write it
back with a separate `.update()` call, then a separate `.insert()` into `wallet_transactions` — three
unlocked round trips. Contrast with `process_partner_payout` (`MIGRATION_FINAL_CLIENT_HANDOVER_2026_06_13.sql:103-190`),
which correctly uses `SELECT ... FOR UPDATE` row locking and does the whole mutation in one
`SECURITY DEFINER` transaction. Two concurrent admin actions (or a retried request) on the same
commission can race and double-credit or corrupt `wallet_balance`. Repair: add
`kia_set_commission_status` RPC using the same locked-transaction pattern as `process_partner_payout`,
call it first from JS with the current unlocked logic kept only as a last-resort fallback (matching this
codebase's existing RPC-first/JS-fallback convention).

**C2. Booking-commission idempotency is not guaranteed to be enforced at the database level —
UNVERIFIED-LIVE.** The JS fallback in `referral-tracking.ts` only pre-checks for an existing row before
inserting (`referral-tracking.ts:220-235`) — a check-then-insert race, not a real guarantee. A real
partial unique index (`(source_type, source_id, partner_id, level) WHERE deleted_at IS NULL`) exists in
**two different migrations** — `uq_commissions_source_partner_level`
(`MIGRATION_REFERRAL_WORKFLOW_HARDENING_2026_06_22.sql:28-30`) and
`commissions_one_active_booking_level_per_partner`
(`MIGRATION_BUSINESS_ENGINE_COMMISSION_LEDGER_2026_07_14.sql:47-49`) — but whether **either** was ever
applied to production is unconfirmed. Without it, concurrent commission generation (e.g. an admin
double-click plus a scheduled re-scan) can insert duplicate commission rows and double-pay a partner.
Repair SQL creates one canonical unique index idempotently and reconciles the two duplicate-named
attempts.

**C3. Two independent commission-generation implementations must be kept in sync by hand.**
The RPC (`kia_generate_booking_commissions`) and the JS fallback in `referral-tracking.ts` currently
agree on rates, eligibility, and level-skip behavior, but the RPC walks `partners.sponsor_id` only,
while the JS path can walk `referral_tree` first (falling back to `sponsor_id`) — if a partner's
`sponsor_id` changes after their `referral_tree` rows were locked, the two paths can disagree on who
gets paid for the same booking depending on which one happens to run. Repair keeps the RPC as the single
source of truth and simplifies the JS fallback to defer to it whenever available, only replicating exact
RPC logic as a last resort (not a "second opinion").

**C4. Payout deduction rate and minimum amount are hardcoded in three separate places, not
settings-driven.** `PAYOUT_DEDUCTION_RATE = 0.15` in `lib/actions/payouts.ts:12`, a second independent
`DEDUCTION_RATE = 0.15` constant in `app/(admin)/admin/reports/page.tsx:6`, and a third in
`app/(admin)/partner/income/page.tsx:7`. The `payouts` table already has a `deduction_rate` column
(`MIGRATION_HANDOVER_PAYMENT_PAYOUT_CONTENT_READY.sql:28`, default 0.15) used correctly as a per-row
snapshot, but nothing lets an admin actually change the rate without a code deploy, and there is no
minimum-payout-amount column anywhere in the schema (confirmed empty grep). Directly matches the
locked business rule "Payout request must read minimum amount and deductions from settings." Repair
adds `system_settings.payout_deduction_rate` and `system_settings.payout_minimum_amount` and wires all
three call sites to read from one place.

**C5. `rejectCommission` writes an invalid enum value and can silently corrupt the wallet today.**
`lib/actions/commissions.ts:103` inserts `wallet_transactions.transaction_type = "commission_reversal"`,
but the `wallet_transaction_type` enum (`SQL_SETUP.sql:124-131`) only contains `commission_credit`,
`payout_debit`, `adjustment_credit`, `adjustment_debit` — `"commission_reversal"` does not exist and this
insert **fails with a database error** every time an admin rejects a previously-approved commission.
Because `reverseWallet` (commissions.ts:77-111) first `UPDATE`s `partners.wallet_balance` and only
*then* attempts the failing `wallet_transactions` insert, with no transaction wrapping either call, the
practical effect today is: **the partner's wallet is silently decremented, no audit row is written, and
the commission status update that was supposed to happen next never runs** because the function throws
first — leaving the commission stuck at `approved` with a wallet balance that no longer matches it. This
is an active bug, not a hypothetical risk. Fixed by `kia_set_commission_status` (which uses the valid
`adjustment_debit` value) in Phase 2, and the JS fallback in Phase 3 is corrected to match.

### HIGH

**H1. Booking referral attribution can be silently overridden by a stale cookie, with no self-referral
guard.** `bookings.ts:196-221` resolves `referral_code` as: submitted form value → `kia_referral_code`
cookie (30-day lifetime, `middleware.ts:72`) → `ozo_referral_code` cookie → the logged-in user's own
partner code, in that order. `memberships.ts` has an explicit self-referral guard (sponsor email vs.
registrant email); `createBooking` has **no equivalent check**. Locked business rule 14 requires
server-controlled attribution that a client cookie must not override without validated logic. Repair
adds the same guard used in memberships (and prefers the logged-in user's own resolved partner identity
over a stale cookie when the user is authenticated and did not submit an explicit code).

**H2. `getPayouts()` fabricates synthetic payout rows — downgraded after re-inspection of the consuming
UI.** `lib/actions/payouts.ts:208-243` generates `{ id: "summary-" + partnerId, is_summary: true, ... }`
objects that were never inserted into the database, concatenated into the same array the admin UI
renders. On inspection, `app/(admin)/admin/payouts/page.tsx` already checks `payout.is_summary`
everywhere it matters — line 149-153 shows an "Available for payout, no request yet" badge instead of
transaction fields, and line 161-164 renders a static "Waiting for partner payout request" message
instead of the status-change form, so a synthetic row can never be mistaken for a real one or fed into
`updatePayoutStatus`. Splitting this into two separate return shapes would touch a working, deliberately
built UI with no way to verify the change against live data in this pass — left as-is. Not fixed in this
pass; revisit only if a future page starts consuming `getPayouts()` without the same `is_summary` guard.

**H3. `partners.pending_payout` is read by the admin UI but does not exist as a column.**
`app/(admin)/admin/partners/page.tsx:213` references `partner.pending_payout`, which `getPartners()`'s
`select("*")` cannot return (no such column in the generated types or schema) — this field silently
renders ₹0 always. Repair points it at the canonical income-summary view built in Phase 2.

**H4. `kia_is_admin()` has two different role sets defined the same day, order-dependent.**
`PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql:76` includes `'staff'`;
`MIGRATION_PRODUCTION_LAUNCH_REPAIR_2026_07_14.sql:77` does not. Both use `CREATE OR REPLACE FUNCTION`,
so whichever ran last silently wins and this cannot be determined from the files. Repair defines one
canonical version and drops the ambiguity.

### MEDIUM

**M1. Four-level attribution is frozen in practice, but only as a side effect, not by design.**
`bookings.referred_by` is already set once at booking creation (`bookings.ts:250`) and never changed
afterward, and both the RPC and JS commission generator already prefer `referred_by` over re-resolving
by code — so the *source* partner is genuinely frozen at creation time. The level 1-4 *ancestor chain*
above that source partner, however, is walked live at the moment commissions are generated (the
paid+confirmed/completed transition), not stored anywhere. Because generation is synchronous with that
status transition and protected by the idempotency constraint (commissions are never regenerated once
they exist), this is a real but narrow window — it only matters if a booking sits paid+confirmed for a
meaningful period before generation runs, which the current architecture does not allow (generation
fires in the same server action as the status change). Documented as a design note rather than fixed
with a new snapshot table, to avoid adding schema complexity for a gap the current synchronous
architecture already closes; if commission generation is ever moved to an async/queued job, this must be
revisited.

**M2. Commission base is gross, not explicitly net-of-discount.** `bookings.discount_snapshot` exists
(`MIGRATION_TREATMENT_IMAGES_STORAGE_2026_07_10.sql:163`) but is always `0` today (no discount UI/flow
exists), and both the RPC and JS commission generators use `payment_amount`/`final_amount`/
`treatment_price` directly with no subtraction step. Functionally correct today (discount is always
zero) but not hardened for when a discount feature ships. Repair introduces an explicit `net_amount`
computed column/expression on `bookings` used as the sole commission base going forward.

**M3. Two disconnected "payment status" representations.** `bookings.payment_status` drives commission
generation; a separate `payments` table (admin-editable via `lib/actions/payments.ts`) has its own
`status` enum and is not linked to bookings by any FK or trigger. Not a live risk today (no payment
gateway is wired up — Razorpay fields are placeholders only per `.env.example`), but should be resolved
before a real webhook is added so a webhook cannot update one without the other.

**M4. Two functionally identical unique indexes exist.** See C2 — beyond the correctness question, the
duplication itself should be cleaned up.

**M5. `lib/db/{bookings,memberships,referrals}.ts` are dead placeholder files** that were never
implemented; the real logic lives entirely in `lib/actions/*`. Not a correctness risk, just dead code
kept as-is (not deleted, per instructions not to remove unrelated features).

### LOW

**L1. `partner_status` enum retains an unused `'approved'` value.** No SQL RPC/trigger and no
application code branches on `status = 'approved'` as eligible for anything. Per the confirmed business
decision, the repair bulk-normalizes existing `'approved'` rows to `'active'`; the enum value itself is
left in place (removing an enum value is a non-additive, harder-to-roll-back operation and existing
rows/IDs must be preserved).

**L2. `ADMIN_PANEL_SETUP.sql` is a stale alternate schema draft** using `VARCHAR` status columns instead
of the enum types actually in use; safe to leave un-run (guarded by `IF NOT EXISTS`, and enum columns
would simply not match if it were ever applied over the real schema — it is not part of the applied
migration chain).

## 4. Duplicate/competing sources of truth (summary)

| Concern | Competing sources | Resolution |
|---|---|---|
| Wallet balance | `partners.wallet_balance` (cached, JS-mutated) vs. `commissions`+`payouts` ledger | Ledger is canonical; cached column becomes a maintained mirror, reconciled automatically per confirmed decision 3 |
| Commission generation | RPC `kia_generate_booking_commissions` vs. JS fallback in `referral-tracking.ts` | RPC is canonical; JS fallback simplified to defer to it |
| Payout deduction rate | 3 hardcoded JS constants vs. `payouts.deduction_rate` column | `system_settings.payout_deduction_rate` becomes canonical input; `payouts.deduction_rate` remains the correct per-row snapshot |
| Payout rows in admin UI | real `payouts` rows vs. synthetic `summary-*` rows | split into two explicit shapes |
| Payment status | `bookings.payment_status` vs. `payments.status` | `bookings.payment_status` remains the commission trigger; `payments` reserved for future gateway audit trail |
| Sales/report totals | `bookings`/`commissions` (current) vs. `partner_sales` (legacy mirror) | Confirmed already resolved — no admin/partner page or reporting view reads money figures from `partner_sales`; it is correctly compatibility-only |

## 5. Implementation phases

1. **Phase 2 (this pass)** — `supabase/kia-financial-repair/` SQL package: read-only diagnostics
   (including the RLS-disabled check from B1), backup snapshots, forward engine repair (canonical
   unique index, locked commission-status RPC, membership-commission logic added to
   `kia_approve_paid_membership`, settings columns, `bookings.net_amount`, re-asserted RLS on financial
   tables), reconciliation/backfill (approved→active, wallet-to-ledger reconciliation), validation
   queries, rollback.
2. **Phase 3 (this pass)** — application code repair: `commissions.ts`, `payouts.ts`, `memberships.ts`,
   `bookings.ts`, `referral-tracking.ts`, admin/partner pages per findings above.
3. **Phase 4 (this pass)** — local checks (typecheck/lint/build) and focused unit tests for the pure
   calculation logic (rate math, idempotency-guard logic, FIFO payout matching).
4. **Not performed in this pass (needs the non-technical user's action)** — running the SQL package
   against staging/production via the Supabase SQL Editor, per the beginner runbook.

## 6. Risks and rollback

Every forward-repair statement is additive (`CREATE OR REPLACE FUNCTION`, `ADD COLUMN IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` which is always safe to
re-run). No `DROP TABLE`, no destructive `DELETE`, no data loss on rollback. The reconciliation script
(approved→active, wallet-to-ledger correction) is the only step that changes existing data values, and
it snapshots every row it is about to change into a `_kia_financial_repair_20260715_*` backup table
before writing, with the before/after values logged to an exception table for audit. The rollback file
restores function/index/RLS-policy state to pre-repair and documents (without automatically re-running)
how to restore snapshotted data if a reconciliation correction needs to be undone.
