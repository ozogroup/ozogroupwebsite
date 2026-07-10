# KIA Skin Care End-to-End QA Report

Date: 2026-07-10

## QA Status

Status: reset completed, manual Auth cleanup completed by project owner, post-reset read-only verification completed.

## Automated Checks

Required checks:

- `npm run build`
- `npx tsc --noEmit` or local TypeScript binary

Current result:

- TypeScript check passed.
- Production build passed.
- Explicit lint run passed with warnings only.
- `git diff --check` passed with only a CRLF normalization warning for `.env.example`.
- Post-reset Supabase read-only verification passed for operational zero-state counts.

These should be rerun after any further code changes and after deployment configuration is finalized.

## Static Schema QA

Checked active app code for verified schema mismatches:

- `memberships.status`: no active usage found.
- `memberships.partner_code`: no active usage found.
- `commissions.deduction_rate`: no active usage found.
- `partners.partner_code`: used as the partner ID source.
- `memberships.membership_status`: used as membership request status.
- `payouts.deduction_rate`: used for payout math, matching verified schema.
- Treatment image URL validation: no active `type="url"` or URL schema validation found in app/image form code.

## Functional QA Checklist

Public website:

- Home opens.
- About opens.
- Treatments list opens.
- Treatment detail opens.
- Membership page opens.
- Referral page opens.
- Contact page opens.
- No old OZO text remains in visible production pages.

Admin panel:

- Admin login works.
- Dashboard stats load from Supabase.
- Treatments page shows final five active records.
- Treatment add/edit/delete/activate/feature works.
- Bookings list loads latest records.
- Membership requests show partner ID, referral code, sponsor, status, created date, password/reset actions where supported, notes, and approval history where present.
- Partners list loads active/pending partners.
- Referral network shows pending and active team members.
- KYC page uses partner KYC fields, not missing `partner_kyc` assumptions.
- Payouts page shows payout rows and partner payout summaries.
- Reports page shows bookings, membership sales, treatment sales, referral growth, income, payouts, monthly revenue, and partner revenue from real data.

Partner portal:

- Partner login works.
- Dashboard cards load real data.
- VIP card shows name, partner ID, date of joining, expiry, status, wallet, and KYC status.
- New member request saves with sponsor/referral preserved.
- Direct Team shows pending and active referrals.
- My Team shows hierarchy without hiding approved partners.
- Income shows membership/product/bonus split.
- Gross, 15% deduction, and net income match admin.
- Payout request is blocked when no balance is available.
- Payout request appears in Admin > Payouts when submitted.
- Paid payout updates paid/pending dashboard values.

Booking flow:

- Public booking opens from active treatment.
- Partner booking opens from active treatment.
- Booking does not fail with "Selected treatment is not available" when treatment exists and is active.
- Booking stores customer name, phone, email if provided, city, address, treatment ID/name/amount, partner/referral code, booking status, payment status, and payment amount.
- Admin booking record shows treatment/kit name correctly.
- Commission generation runs where business rules require it.

Payout flow:

- Gross Income = Membership Income + Product Income + Bonus Income.
- Deduction = Gross Income x 15%.
- Net Payable = Gross Income - Deduction.
- Pending Payout = Net Payable - Paid Amount.
- Admin approve/reject/mark-paid actions update status and partner totals.
- Transaction reference is stored when supplied.

Responsive QA:

- Mobile navigation works.
- Admin sidebar/table layouts do not overflow.
- Partner dashboard card is readable on mobile.
- Modals scroll correctly.
- Tables remain usable on tablet and mobile.
- No dark text on dark background.
- No broken or overlapping buttons.

## Known Non-Blocking Warnings

The production build may still report Next.js image optimization warnings for plain `<img>` usage in admin/partner screens and React hook dependency warnings in some admin CRUD pages. These are not runtime blockers, but they should be cleaned up during polish.

## Final Live QA Pending

The following items are complete:

- Fresh-start reset execution
- Auth user cleanup
- Operational zero-state verification
- Treatment/content preservation verification

Remaining manual checks:

- First admin credential login after reset
- Client account role login after an app profile role is explicitly assigned/confirmed
- First partner onboarding after reset
- First membership approval after reset
- First treatment booking after reset
- First payout request lifecycle after reset

## Production Readiness Score

Current score after reset and manual Auth cleanup: 9.0/10.

Expected score after client app profile role confirmation and live credential smoke test: 9.5/10.
