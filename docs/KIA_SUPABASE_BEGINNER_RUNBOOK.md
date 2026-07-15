# KIA Supabase Runbook — For a Non-Technical Person

This guide assumes you have never used Supabase's SQL Editor before. Follow every
step in order. Do not skip steps. If anything on your screen looks different from
what this guide describes, stop and share a screenshot before continuing.

You will need: the email/password (or Google login) you use to log into
[supabase.com](https://supabase.com), and about 20-30 minutes of uninterrupted time.

---

## Before you start: take a backup

This is the single most important step. Even though every file in this repair was
written to be safe, always have a backup.

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click on the **KIA Skin Care** project to open it.
3. In the left sidebar, click **Database**.
4. Click **Backups** (near the top of that page).
5. If you see a "Create backup" or "Backup now" button, click it and wait for it to
   say "Completed". If your plan only shows automatic daily backups with no manual
   button, note the time of the most recent automatic backup shown on screen — that
   is your safety net.
6. **Take a screenshot of this backups page and save it somewhere.** This is your
   proof of the "before" state.

Once you have a backup (or confirmed a recent automatic one exists), continue.

---

## Where to find the files

All the files you need are in this folder inside the project, in this exact
GitHub-visible path: `supabase/kia-financial-repair/`. There are 6 files named
`01_...` through `06_...`. You will run `01` through `05`, in that order, in one
sitting. **Do not run `06` unless someone specifically tells you to** — it is only
for undoing this repair.

---

## How to open the SQL Editor

1. In the Supabase dashboard for the KIA project, look at the left sidebar.
2. Click **SQL Editor** (it has a `>_` icon).
3. Click the **+ New query** button (usually top-left of that page).
4. You will see a big empty white/dark box — this is where you paste code.

---

## Step 1 — Read-only check (safe, changes nothing)

1. Open the file `supabase/kia-financial-repair/01_READ_ONLY_LIVE_DIAGNOSTICS.sql`
   in this project (ask whoever gave you this project to open it for you, or open it
   in any plain text/code editor — Notepad works).
2. Select all the text in that file (Ctrl+A) and copy it (Ctrl+C).
3. Go back to the Supabase SQL Editor tab, click inside the empty query box, and
   paste (Ctrl+V).
4. Click the **Run** button (bottom-right, or press Ctrl+Enter).
5. **What you should see:** several small result tables appear below, one after
   another (there are 10 separate checks in this file — Supabase will usually show
   you only the last one's result, which is fine; you'll see the full picture in
   Step 5 later). Nothing should say "ERROR" in red.
6. If it does say ERROR: stop here and share the exact red error message. Do not
   continue to Step 2.

If it ran without a red error, continue.

---

## Step 2 — Backup snapshots inside the database (safe, only adds new tables)

1. Open `supabase/kia-financial-repair/02_PRE_MIGRATION_BACKUP_SNAPSHOTS.sql`.
2. Select all, copy.
3. In the Supabase SQL Editor, click **+ New query** again (start a fresh box —
   don't paste over Step 1's query), paste, and click **Run**.
4. **What you should see:** a series of messages starting with "Snapshot created:"
   for each table, and then a small results table at the bottom comparing
   `snapshot_rows` to `live_rows` for each table — these two numbers should match
   for each row.
5. If you see any red ERROR, stop and share it.

---

## Step 3 — The main repair (safe, does not change any existing numbers)

1. Open `supabase/kia-financial-repair/03_FORWARD_FINANCIAL_ENGINE_REPAIR.sql`.
2. Select all, copy.
3. **+ New query**, paste, **Run**.
4. This one is longer and may take a few seconds. **What you should see:** it ends
   with "Success. No rows returned" or similar, with no red ERROR text anywhere.
5. If you see a red error mentioning **"duplicate"** and **"commission"**: this
   means Step 1's diagnostic found a problem with existing data that needs a real
   person to look at before continuing. Stop and share the message — do not try to
   fix it yourself.
6. If you see a red error saying something is **"missing"** (for example, mentions
   `kia_is_admin`): this means an older required setup file hasn't been run yet.
   Stop and share the exact message.
7. Any other red error: stop and share it.

---

## Step 4 — Apply the confirmed decisions (this is the only step that changes numbers)

This step does exactly three things you already approved:
- Moves any partner stuck in an old "approved" status to "active".
- Fixes any partner wallet number that doesn't match their actual commission
  history.
- Pays the new ₹500 membership bonus for existing members who joined before today
  and don't have it yet.

1. Open `supabase/kia-financial-repair/04_RECONCILIATION_AND_SAFE_BACKFILL.sql`.
2. Select all, copy.
3. **+ New query**, paste, **Run**.
4. **What you should see:** no red ERROR. It may return a small summary table at the
   end.
5. If you see a red error: stop and share it. Nothing has been lost — see the
   "Rollback conditions" section below.

---

## Step 5 — Confirm everything worked

1. Open `supabase/kia-financial-repair/05_POST_MIGRATION_VALIDATION.sql`.
2. Select all, copy.
3. **+ New query**, paste, **Run**.
4. This file has several numbered checks, each with a comment above it saying what
   the "Expected" result is. Since Supabase only shows you the last query's result
   by default, run each numbered check **one at a time** for a clear picture:
   - Select just the SQL under "-- 1." (one paragraph) and click Run — compare to
     "Expected: 4 rows, all with is_security_definer = true."
   - Then select just "-- 2." and Run — compare to "Expected: every row shows
     rls_enabled = true."
   - Continue this way through "-- 9."
5. **Take a screenshot of check #2's result (the RLS table) and check #4's result
   (should be zero rows) and share both with whoever is helping you.** These two are
   the most important safety confirmations.

If every check matches its "Expected" description, the repair is complete and
verified. If anything does not match, stop and share a screenshot of that specific
check's result — do not attempt further changes yourself.

---

## What you do NOT need to run

- `06_ROLLBACK_FINANCIAL_ENGINE_REPAIR.sql` — only if told to undo the repair.
- Any file outside `supabase/kia-financial-repair/` — those are older, historical
  files kept only for reference.

## What screenshot/result to share back

After Step 5, share:
1. A screenshot of the Backups page from before you started (from the "Before you
   start" section).
2. A screenshot of Step 5's check #2 (RLS enabled table).
3. A screenshot of Step 5's check #4 (should say "zero rows"/be empty).
4. Confirmation that Steps 1-5 all completed with no red ERROR text.

## When to stop and ask for help

Stop immediately and do not continue to the next step if:
- Any step shows red ERROR text you don't understand.
- A step takes more than 2 minutes with no response (long-running query) — this is
  unusual for this repair; take a screenshot of the loading state and ask.
- You're unsure whether a result "matches" what's expected.

## Rollback conditions

You do not need to do anything to "undo" Steps 1, 2, or 5 — they don't change
anything that needs undoing. If Step 3 or Step 4 produced a red error, nothing was
left half-done (each is wrapped so it either fully finishes or fully cancels itself
automatically). If, after everything ran successfully, something in the app looks
wrong and you want to undo just Step 3, see
`docs/KIA_RELEASE_AND_ROLLBACK_GUIDE.md` and run
`06_ROLLBACK_FINANCIAL_ENGINE_REPAIR.sql` — but talk to whoever is helping you
first.
