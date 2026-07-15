# KIA Financial Repair — Release and Rollback Guide

## Current state

- Branch: `claude/kia-financial-system-repair`, created from
  `codex/kia-production-launch-repair`.
- Nothing pushed to any remote. No pull request opened. No deployment performed.
- No SQL run against staging or production.

## Commit plan

Work on this branch is committed in this logical sequence (matches the standing
instructions for this repair):

1. `docs: audit current KIA financial architecture`
2. `db: add safe financial engine repair package`
3. `fix: unify booking and commission lifecycle`
4. `fix: derive partner wallet and income from ledger`
5. `fix: implement payout reservation and settlement`
6. `fix: align admin and partner financial dashboards`
7. `test: add financial lifecycle validation`
8. `docs: add Supabase execution and release guide`

Commits are created only on this branch. Nothing is pushed or merged without
explicit approval.

## Release order (do these in order, do not skip ahead)

1. **Code review.** Read `docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md` in full, and this
   guide.
2. **Apply the SQL package to a staging/preview Supabase project first** — never
   production first. Follow `docs/KIA_SUPABASE_BEGINNER_RUNBOOK.md`.
3. **Run the controlled hierarchy test** — see
   `docs/KIA_MANUAL_QA_CHECKLIST.md`, "Setup" and "Booking commission" sections.
4. **Run local app checks:** `npx tsc --noEmit`, `npm run lint`, `npm run build`,
   `npm run test` — all already verified passing as of this repair; re-run them
   yourself before deploying to confirm nothing has drifted since.
5. **Create a Vercel preview deployment** of this branch (do not deploy to
   production yet) pointed at the staging Supabase project.
6. **Run the full manual QA checklist** (`docs/KIA_MANUAL_QA_CHECKLIST.md`) against
   that preview deployment.
7. **Take a production database backup** (Supabase Dashboard → Database → Backups)
   before touching production, even though the SQL package is designed to be safe.
8. **Apply the SQL package to production**, following the same runbook, in the same
   order (01 → 02 → 03 → 04 → 05).
9. **Deploy the reviewed build to production** (Vercel) only after step 8 succeeds
   and step 5 of the runbook's validation checks all pass against production.
10. **Re-run post-deploy smoke tests**: admin login, partner login, one real booking
    end-to-end, one real membership approval end-to-end, dashboard figures match
    across admin/partner views.

Do not push, merge, or deploy any step above without your explicit go-ahead.

## Risk summary

| Risk | Mitigation |
|---|---|
| RLS may currently be disabled on financial tables in production | Step 03 of the SQL package re-enables it; validated by 05's check #2 before you treat it as fixed |
| Migration files from 2026-07-14 may never have been applied to production | Every RPC touched by this repair is redefined with `CREATE OR REPLACE`, so it is created correctly regardless of prior state |
| Duplicate commissions if the database-level unique index was never applied | 03 creates it defensively; if duplicates already exist, it fails loudly and safely instead of silently creating a broken index — see runbook Step 3 |
| Wallet/ledger reconciliation changes real numbers | Full backup snapshot (02) + a per-partner change log table, before any value is touched |
| New membership commission is a new money flow | Confirmed explicitly with the project owner (flat ₹500, level 1 only) before implementation; backfill only applies to already-approved memberships, using the same idempotency protection as everything else |

## Rollback conditions

Roll back **application code** (this branch/commits) if:
- The build or any local check starts failing after further changes.
- QA finds a genuine regression in an unrelated feature.

Roll back **database changes** (run `06_ROLLBACK_FINANCIAL_ENGINE_REPAIR.sql`) if:
- A function from step 03 needs to be reverted to its pre-repair definition.
- Read `06`'s header first — it deliberately does **not** auto-undo step 04's data
  corrections (partner status normalization, wallet reconciliation, membership
  commission backfill). Reversing a financial correction automatically is exactly
  the kind of silent action this repair was built to avoid. If step 04's changes
  truly need to be undone, do it manually and deliberately per-partner using the
  snapshot and correction-log tables it created — instructions are in `06`'s footer
  comments.
- RLS is **never** rolled back to a disabled state by any file in this package —
  that would reintroduce the most severe finding in the audit. If you believe RLS
  genuinely needs to be relaxed for a specific, understood reason, that is a manual,
  deliberate decision to make with full awareness of the tradeoff, not an automated
  rollback step.

## What "done" looks like

- `05_POST_MIGRATION_VALIDATION.sql` in staging: every check matches its documented
  "Expected" result.
- `docs/KIA_MANUAL_QA_CHECKLIST.md`: every box checked against the staging preview.
- Production backup taken, SQL package applied to production, validation re-run
  against production, production deploy done, smoke tests pass.
- Only then: consider opening a pull request from this branch, and only if you ask
  for it.
