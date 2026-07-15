// Pure financial calculation helpers shared by the server actions that touch
// money (lib/actions/commissions.ts, payouts.ts, referral-tracking.ts,
// memberships.ts). Kept dependency-free (no Supabase import) so this module
// is unit-testable without a database and so this logic has exactly one
// implementation instead of being duplicated inline across those files.

export const DEFAULT_COMMISSION_RATES = { 1: 6, 2: 3, 3: 1.7, 4: 1.2 } as const;
export type CommissionLevel = 1 | 2 | 3 | 4;

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Commission amount for a given source amount and percentage, rounded to paise. */
export function computeCommissionAmount(sourceAmount: number, percentage: number): number {
  return Math.round((Number(sourceAmount) || 0) * (Number(percentage) || 0)) / 100;
}

/** Merges a partial/row-shaped settings override over the confirmed defaults (6/3/1.7/1.2). */
export function resolveCommissionRates(
  settings?: Partial<Record<CommissionLevel, number | null | undefined>> | null
): Record<CommissionLevel, number> {
  return {
    1: Number(settings?.[1]) || DEFAULT_COMMISSION_RATES[1],
    2: Number(settings?.[2]) || DEFAULT_COMMISSION_RATES[2],
    3: Number(settings?.[3]) || DEFAULT_COMMISSION_RATES[3],
    4: Number(settings?.[4]) || DEFAULT_COMMISSION_RATES[4],
  };
}

/** Net-of-discount commission base (locked business rule: net = gross - approved discount). */
export function computeBookingNetAmount(grossAmount: number, discount: number): number {
  return Math.max(0, roundMoney((Number(grossAmount) || 0) - (Number(discount) || 0)));
}

export type PayoutBreakdown = { gross: number; deduction: number; net: number };

export function computePayoutBreakdown(grossAmount: number, deductionRate: number): PayoutBreakdown {
  const gross = roundMoney(grossAmount);
  const deduction = roundMoney(gross * (Number(deductionRate) || 0));
  const net = roundMoney(gross - deduction);
  return { gross, deduction, net };
}

export type FifoCommissionRow = { id: string; amount: number | null };

/**
 * Selects the oldest-first commission rows (already sorted ascending by the
 * caller) whose amounts sum to at most grossAmount, matching the FIFO
 * settlement rule used when a payout is marked paid. Never over-selects: a
 * row larger than the remaining balance is skipped, not partially matched.
 */
export function selectCommissionsForFifoPayout(rows: FifoCommissionRow[], grossAmount: number): string[] {
  let remaining = Number(grossAmount) || 0;
  const ids: string[] = [];
  for (const row of rows) {
    if (remaining <= 0.009) break;
    const amount = Number(row.amount || 0);
    if (amount <= 0 || amount > remaining + 0.009) continue;
    ids.push(row.id);
    remaining = roundMoney(remaining - amount);
  }
  return ids;
}

export type PartnerEligibilityInput = {
  status?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
  membership_expires_at?: string | null;
} | null | undefined;

/** Whether a partner is eligible to receive a commission right now (active, not soft-deleted, membership not expired). */
export function isPartnerEligibleForCommission(partner: PartnerEligibilityInput, now: Date = new Date()): boolean {
  if (!partner) return false;
  if (partner.status !== "active") return false;
  if (partner.is_active === false) return false;
  if (partner.deleted_at) return false;
  if (partner.membership_expires_at && new Date(partner.membership_expires_at).getTime() < now.getTime()) return false;
  return true;
}

export type PayoutSettingsInput = {
  deductionRate: number;
  minimumAmount: number;
  kycRequired: boolean;
  bankRequired: boolean;
  singleOpenRequestOnly: boolean;
};

export type PayoutRequestEligibilityInput = {
  walletBalance: number;
  requestedAmount: number;
  kycStatus?: string | null;
  bankVerified?: boolean | null;
  membershipActive: boolean;
  hasOpenRequest: boolean;
  settings: PayoutSettingsInput;
};

/** Mirrors the gating checks in lib/actions/payouts.ts requestPartnerPayout, as one pure/testable predicate. */
export function evaluatePayoutRequestEligibility(
  input: PayoutRequestEligibilityInput
): { allowed: boolean; error?: string } {
  const { walletBalance, requestedAmount, kycStatus, bankVerified, membershipActive, hasOpenRequest, settings } = input;
  const minimumLabel = settings.minimumAmount.toLocaleString("en-IN");

  if (settings.kycRequired && kycStatus !== "verified") {
    return { allowed: false, error: "KYC approval is required before withdrawal." };
  }
  if (settings.bankRequired && !bankVerified) {
    return { allowed: false, error: "Bank details must be verified before withdrawal." };
  }
  if (!membershipActive) {
    return { allowed: false, error: "Membership must be active before withdrawal." };
  }
  if (walletBalance < settings.minimumAmount) {
    return { allowed: false, error: `Minimum wallet balance for payout is Rs. ${minimumLabel}.` };
  }
  if (!Number.isFinite(requestedAmount) || requestedAmount < settings.minimumAmount) {
    return { allowed: false, error: `Minimum payout amount is Rs. ${minimumLabel}.` };
  }
  if (requestedAmount > walletBalance) {
    return { allowed: false, error: "Insufficient wallet balance." };
  }
  if (settings.singleOpenRequestOnly && hasOpenRequest) {
    return { allowed: false, error: "A payout request is already pending. Please wait for the admin to process it." };
  }
  return { allowed: true };
}
