# KIA Financial Repair — Manual QA Checklist

Run this after the SQL package (`supabase/kia-financial-repair/`) has been applied
to a staging/preview Supabase project — not production — and a Vercel preview
deployment of this branch is live. Use real test accounts, never real customer data.

## Setup

- [ ] Create a controlled 4-level partner chain: A (top) → B → C → D → E, each
      created via the normal membership flow and approved by admin.
- [ ] Confirm each of A/B/C/D/E has `status = active` and a `partner_code` after
      approval.

## Membership commission (new feature)

- [ ] Register a new member F with referral code = E's code.
- [ ] Admin marks F's membership payment "paid" and approves it.
- [ ] Confirm exactly **one** new row appears in Commissions: `source_type =
      membership`, `partner_id = E`, `level = 1`, `amount = 500.00`, `status =
      pending`. No row for D, C, B, or A (flat, level-1-only, as confirmed).
- [ ] Approve that commission as admin. Confirm E's wallet balance increases by
      exactly ₹500 and a wallet transaction row is created.
- [ ] Re-run the same approval action again (or click Approve twice quickly).
      Confirm the wallet is **not** credited a second time.
- [ ] Register a member with no valid referral code (top-of-chain signup). Confirm
      no membership commission row is created (no sponsor to pay).

## Booking commission (4-level, unchanged rates)

- [ ] Create a paid + confirmed booking sourced from partner E.
- [ ] Confirm commission rows: D at Level 1 (6%), C at Level 2 (3%), B at Level 3
      (1.7%), A at Level 4 (1.2%). No row for E (source partner never earns on their
      own booking). No Level 5 row.
- [ ] Re-trigger commission generation for the same booking (e.g. toggle status or
      run "generate missing commissions"). Confirm no duplicate rows are created.
- [ ] Reject a previously-approved commission. Confirm the wallet is correctly
      decremented, a wallet transaction row is written, and no error appears (this
      exercises the bug fix for the invalid-status error).

## Referral attribution

- [ ] As an anonymous visitor, click a referral link for partner B, then submit a
      booking with no explicit referral code typed in the form. Confirm the booking
      is attributed to B.
- [ ] Log in as partner C, with a stale referral cookie for partner B still present
      in the browser (from the step above). Book a treatment without typing any
      referral code. Confirm the booking is attributed to C's own resolved partner
      code, not silently overridden by B's cookie.
- [ ] Submit a booking with an explicit referral code typed into the form. Confirm
      that explicit code wins over any cookie present.

## KYC / payout gating

- [ ] As a partner with `kyc_status != verified`, confirm the dashboard, income, and
      commissions pages still show full earnings/pending/paid figures (KYC must
      never hide earnings).
- [ ] As that same partner, attempt to request a payout. Confirm it is blocked with
      a clear "KYC approval is required" message.
- [ ] Approve KYC and verify bank details for that partner. Confirm the payout
      request now succeeds (assuming wallet balance ≥ the configured minimum).
- [ ] In Admin → Settings, toggle "Require KYC for Payout Request" off. Confirm a
      non-KYC-verified partner can now request a payout (settings-driven gate
      working).

## Payout lifecycle

- [ ] Request a payout as a partner with sufficient wallet balance. Confirm the
      admin Payouts page shows it with correct gross/deduction/net figures using the
      currently configured deduction rate.
- [ ] Attempt a second payout request from the same partner while the first is still
      `requested`/`processing`. Confirm it is blocked ("already pending").
- [ ] In Admin → Settings, change the deduction rate (e.g. to 20%) and save. Confirm
      a new payout request uses the new rate, and confirm the admin Reports page and
      partner Income page also reflect the new rate (no page still shows the old
      hardcoded 15%).
- [ ] As admin, mark the payout "paid" with a transaction reference. Confirm: the
      partner's wallet decreases by the gross amount, `paid_earnings` increases by
      the net amount, the oldest approved commissions up to the gross amount are
      marked `paid` with `payout_id` set, and a wallet transaction row is created.
- [ ] Click "Mark Paid" a second time on the same payout. Confirm nothing is
      double-processed (no second wallet debit, no error that leaves data
      inconsistent).
- [ ] Reject a different pending payout request. Confirm no wallet change occurs and
      the partner can submit a new request afterward.

## Dashboard consistency

- [ ] Compare the wallet balance / total earnings shown on: Admin Dashboard, Admin
      Partners list, Admin Payouts, Partner Dashboard, Partner Income. All five must
      show the same numbers for the same partner.
- [ ] Confirm the Admin Partners page's "Pending" figure under a partner's earnings
      is no longer a hardcoded ₹0 (see repair note on `pending_payout`).

## Legacy status normalization

- [ ] If any partner existed at `status = approved` before the repair, confirm they
      now show `status = active`, have a `partner_code`, and appear correctly in
      referral/commission eligibility checks.

## RLS / security sanity check

- [ ] Using the Supabase Table Editor (not SQL Editor) logged in as a non-admin
      test role if possible, confirm `commissions`, `payouts`, and `wallet_transactions`
      cannot be read/written outside the intended partner-self/admin policies.
- [ ] Re-run `05_POST_MIGRATION_VALIDATION.sql` check #2 and confirm every listed
      table shows `rls_enabled = true`.

## Regression check (unrelated features not broken)

- [ ] Public site (home, treatments, membership, contact) loads normally.
- [ ] Admin CRUD for treatments/testimonials/FAQs/content still works.
- [ ] Existing booking creation (without any referral code at all) still succeeds
      and does not error.
