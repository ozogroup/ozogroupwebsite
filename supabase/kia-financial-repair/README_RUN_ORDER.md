# KIA Financial Repair — SQL Run Order

For the non-technical, click-by-click version of these steps, see
`docs/KIA_SUPABASE_BEGINNER_RUNBOOK.md`. This file is the technical reference.

## Prerequisites

Run these two base files first if you are not certain they have already been applied
(both are safe to re-run — everything in them is `IF NOT EXISTS`/`CREATE OR REPLACE`):

1. `supabase/SQL_SETUP.sql`
2. `supabase/PATCH_RESTORE_LAUNCH_HELPERS_2026_07_14.sql`

`01_READ_ONLY_LIVE_DIAGNOSTICS.sql` (below) will tell you whether these are present —
you do not have to guess.

## Run order

| # | File | Read-only? | What it does |
|---|---|---|---|
| 1 | `01_READ_ONLY_LIVE_DIAGNOSTICS.sql` | Yes | Checks RLS status, existing functions/indexes, wallet mismatches, ambiguous bookings. Changes nothing. |
| 2 | `02_PRE_MIGRATION_BACKUP_SNAPSHOTS.sql` | No (only adds new backup tables) | Full-copy snapshots of every financial table before anything else runs. |
| 3 | `03_FORWARD_FINANCIAL_ENGINE_REPAIR.sql` | No | Adds settings/columns, canonical idempotency index, fixed RPCs, re-asserts RLS. Does not change any existing row's values. |
| 4 | `04_RECONCILIATION_AND_SAFE_BACKFILL.sql` | No | The only file that changes existing values: `approved`→`active` normalization, wallet-to-ledger correction, membership-commission backfill. Every change is logged. |
| 5 | `05_POST_MIGRATION_VALIDATION.sql` | Yes | Confirms 3 and 4 worked as expected. |
| 6 | `06_ROLLBACK_FINANCIAL_ENGINE_REPAIR.sql` | No | Only run if step 3 must be undone. Read its header first — it deliberately does not undo step 4's data corrections automatically. |

Run 1 through 5 in order, in one sitting, in the Supabase SQL Editor. Do not skip 1 or
2. Do not run 6 unless something in step 3 needs to be undone.

## Safety properties

- Every statement in 1, 2, 3, 5 is additive/non-destructive and safe to re-run.
- Step 4 is the only file that overwrites existing values, and only for the three
  cases explicitly confirmed with the project owner on 2026-07-15 (see
  `docs/KIA_CURRENT_ARCHITECTURE_AUDIT.md` section 1). Every value it changes is
  backed up in step 2's snapshot tables and separately logged in a
  `_kia_financial_repair_20260715_*_corrections` table with before/after values.
- No `DROP TABLE`, no `DELETE` of production rows, no destructive operation anywhere
  in files 1-5.
- Nothing here was run against any live database by the assistant that produced this
  package — every statement was authored and reviewed against the SQL source files in
  this repository only.

## If something goes wrong mid-run

Each file is wrapped in `BEGIN; ... COMMIT;` where it matters (files 3 and 4). If the
Supabase SQL Editor reports an error partway through one of those files, the whole
file's changes are rolled back automatically by Postgres — you will not be left in a
half-applied state. Fix the reported error (often a duplicate row found in a
diagnostic pre-check) and re-run the same file; every statement is safe to re-run.
