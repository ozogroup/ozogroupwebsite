# KIA Financial System Repair — Summary

Date: 2026-07-15
Branch: `claude/kia-financial-system-repair`
Production deploy: not performed. No SQL run against any live database.

Full technical findings: `docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md`.

## 1. What was broken

- **Membership approval had no fallback.** If the database RPC that activates a new
  partner was ever missing (plausible — a prior audit says its own migration files
  "were not applied"), admin could not approve any membership at all. No partners
  could ever be onboarded.
- **RLS may currently be off on every financial table.** An old file
  (`FIX_RLS_RECURSION.sql`) disables Row-Level Security on `commissions`, `payouts`,
  `partners`, `bookings`, `memberships` — nothing later in the repository re-enables
  it. If that file was ever run in production, those tables are protected only by
  application code, not the database.
- **Rejecting an approved commission was an active, live bug.** The code wrote an
  invalid database value (`"commission_reversal"`) that isn't a real status the
  database accepts. In practice: the partner's wallet was silently decremented, no
  record of why was saved, and the commission was left stuck in the wrong state.
- **Approving/rejecting a commission had no protection against being run twice at the
  same time** (two admin clicks, or two requests overlapping) — nothing stopped a
  double payment in that narrow window.
- **Duplicate booking-commission protection was not guaranteed to exist in the live
  database** — the app only checked "does this already exist?" and then inserted,
  which is not a real guarantee under concurrent requests.
- **The wallet balance shown to partners and admin was a manually-updated number**,
  not calculated from the actual commission/payout records — so it could silently
  drift from the truth over time with no way to notice.
- **The 15% payout fee and Rs 1000 minimum payout were hardcoded in three different
  files** — an admin had no way to change them without a code change and a new
  deployment.
- **Referral attribution on a booking could be silently taken over by an old browser
  cookie**, even for a logged-in partner, with no check preventing this.
- **Membership signups earned no commission for anyone** — the partner income screen
  had a "Membership Income" section that would always show ₹0, because that feature
  was never actually built.
- Several smaller issues: a broken "Pending payout" number always showing ₹0 on the
  admin partners page; two admin-check functions with different rules defined the
  same day (order-dependent, unclear which one actually applies); some partners
  possibly stuck in an old "approved" status invisible to every part of the app that
  only recognizes "active".

## 2. Root cause

The system evolved through many separate patch files over several months, each
solving one problem in isolation without a single canonical financial engine. Money
math (wallet updates, payout deduction rate, commission approval) was written
directly and separately, by hand, in multiple JavaScript files instead of going
through one protected, atomic path in the database — so nothing guaranteed
correctness when two things happened at once, and nothing guaranteed every file
agreed on the same numbers. Several database migration files were written and
reviewed but their own headers say they were never actually run in production, which
means the live database's true state has been genuinely uncertain.

## 3. What files were changed

Application code:

- [`lib/actions/memberships.ts`](lib/actions/memberships.ts) — added a full fallback
  for membership approval so it can never become a launch blocker; added the new
  flat membership-referral commission.
- [`lib/actions/commissions.ts`](lib/actions/commissions.ts) — approve/reject now go
  through the new locked, atomic database function first; fixed the invalid-value
  bug in the fallback path.
- [`lib/actions/payouts.ts`](lib/actions/payouts.ts) — deduction rate, minimum
  amount, and KYC/bank/single-request rules are now read from settings instead of
  hardcoded; de-duplicated math logic.
- [`lib/actions/bookings.ts`](lib/actions/bookings.ts) — fixed referral-attribution
  precedence so a stale cookie can't override a logged-in user's own identity.
- [`lib/actions/referral-tracking.ts`](lib/actions/referral-tracking.ts) — uses the
  net-amount commission base and the shared eligibility/rate logic.
- [`lib/actions/system-settings.ts`](lib/actions/system-settings.ts) — admin can now
  save the new payout/membership-bonus settings.
- [`lib/finance.ts`](lib/finance.ts) — **new** — one shared, tested module for every
  piece of money math (commission amounts, payout breakdown, FIFO payout matching,
  eligibility rules) so it is never duplicated or drifted again.
- [`app/(admin)/admin/settings/page.tsx`](<app/(admin)/admin/settings/page.tsx>) —
  new "Payout Settings" card.
- [`app/(admin)/admin/reports/page.tsx`](<app/(admin)/admin/reports/page.tsx>),
  [`app/(admin)/partner/income/page.tsx`](<app/(admin)/partner/income/page.tsx>) —
  read the deduction rate from settings instead of a hardcoded number.
- [`app/(admin)/admin/partners/page.tsx`](<app/(admin)/admin/partners/page.tsx>) —
  fixed the "Pending payout" figure that always showed ₹0.

## 4. What database files were created

`supabase/kia-financial-repair/` (see `README_RUN_ORDER.md` inside that folder for
full detail):

1. `01_READ_ONLY_LIVE_DIAGNOSTICS.sql` — read-only, checks what's actually true in
   production right now.
2. `02_PRE_MIGRATION_BACKUP_SNAPSHOTS.sql` — full backup copies before anything
   changes.
3. `03_FORWARD_FINANCIAL_ENGINE_REPAIR.sql` — adds settings, fixes the RPCs, adds a
   new locked commission-approval function, re-asserts database-level security.
4. `04_RECONCILIATION_AND_SAFE_BACKFILL.sql` — the only file that changes existing
   numbers: normalizes old "approved" partners to "active", corrects any wallet
   drift to match the real ledger, and pays the new membership bonus retroactively
   for existing members. Every change is logged.
5. `05_POST_MIGRATION_VALIDATION.sql` — confirms everything worked.
6. `06_ROLLBACK_FINANCIAL_ENGINE_REPAIR.sql` — undo, if ever needed.

## 5. What was tested locally

- `npx tsc --noEmit` — passes, zero errors.
- `npm run build` — production build succeeds.
- `npm run lint` — passes (only pre-existing, unrelated warnings).
- `npm run test` (new) — 41 automated tests, all passing, covering: four-level
  commission math, the confirmed flat membership bonus math, net-amount discount
  math, payout deduction math, FIFO payout-settlement matching, partner eligibility
  rules (including the legacy "approved" status correctly being treated as
  ineligible), and every KYC/bank/minimum-amount/duplicate-request payout gate.

## 6. What could not be tested without production access

- Whether Row-Level Security is actually enabled right now in the live database
  (this is exactly what step 1 of the SQL package checks for you).
- Whether the 2026-07-14 migration files were ever actually applied to production.
- The database-level duplicate-commission protection (the unique index) and the new
  locked approve/reject function — these require a real Postgres database to
  exercise; `05_POST_MIGRATION_VALIDATION.sql` is written for you to run this
  exact check in Supabase once the SQL package is applied.
- Any real end-to-end click-through of the admin/partner UI (no dev server run
  against live data in this pass).

## 7. Exact decisions still required

Three were already resolved with you on 2026-07-15 (see architecture audit section
1): membership commission = flat ₹500 to direct sponsor only; legacy "approved"
partners auto-promoted to "active"; wallet/ledger mismatches auto-corrected.

Nothing else is currently blocking. One optional follow-up worth a decision later:
whether the payout deduction rate/minimum amount should differ by partner tier —
today they are a single global setting, which matches how the app already behaved.

## 8. Exact SQL execution order

Run, in this order, inside the Supabase SQL Editor, in one sitting:
`01` → `02` → `03` → `04` → `05`. Full click-by-click steps are in
`docs/KIA_SUPABASE_BEGINNER_RUNBOOK.md`. Do not run `06` unless something needs to be
undone.

## 9. Exact Git branch and commit status

- Branch: `claude/kia-financial-system-repair`, created from
  `codex/kia-production-launch-repair`.
- Nothing has been pushed to any remote. No pull request has been opened.
- Commits on this branch follow the sequence in
  `docs/KIA_RELEASE_AND_ROLLBACK_GUIDE.md`.

## 10. Exact next action for you (non-technical)

1. Open `docs/KIA_SUPABASE_BEGINNER_RUNBOOK.md` and follow it top to bottom — it
   walks through taking a Supabase backup and running the 5 SQL files, one at a
   time, with a screenshot description of what each success result should look
   like.
2. After that, come back and tell me the results (or just say "done") — I will not
   push, deploy, or open a pull request until you explicitly ask me to.
