-- Adds optional UPI payout fields without removing existing bank details.
-- Run once in Supabase SQL editor before using the expanded KYC form.

alter table public.partner_kyc
  add column if not exists upi_holder_name text,
  add column if not exists upi_mobile text,
  add column if not exists upi_app text;

alter table public.partners
  add column if not exists upi_holder_name text,
  add column if not exists upi_mobile text,
  add column if not exists upi_app text;

create index if not exists idx_partner_kyc_upi_id
  on public.partner_kyc (upi_id)
  where upi_id is not null;
