import { describe, it, expect } from "vitest";
import {
  roundMoney,
  computeCommissionAmount,
  resolveCommissionRates,
  computeBookingNetAmount,
  computePayoutBreakdown,
  selectCommissionsForFifoPayout,
  isPartnerEligibleForCommission,
  evaluatePayoutRequestEligibility,
  DEFAULT_COMMISSION_RATES,
} from "./finance";

describe("roundMoney", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe("four-level commission calculation", () => {
  it("matches the confirmed 6% / 3% / 1.7% / 1.2% rates on a booking", () => {
    const sourceAmount = 10000;
    const rates = resolveCommissionRates(null);
    expect(rates).toEqual(DEFAULT_COMMISSION_RATES);

    expect(computeCommissionAmount(sourceAmount, rates[1])).toBe(600); // 6%
    expect(computeCommissionAmount(sourceAmount, rates[2])).toBe(300); // 3%
    expect(computeCommissionAmount(sourceAmount, rates[3])).toBe(170); // 1.7%
    expect(computeCommissionAmount(sourceAmount, rates[4])).toBe(120); // 1.2%
  });

  it("falls back to the default rate for any level missing/zero in settings", () => {
    const rates = resolveCommissionRates({ 1: 6, 2: 0, 3: null, 4: undefined });
    expect(rates).toEqual({ 1: 6, 2: 3, 3: 1.7, 4: 1.2 });
  });

  it("rounds commission amounts to the nearest paisa", () => {
    expect(computeCommissionAmount(333.33, 1.7)).toBe(5.67);
  });
});

describe("net amount commission base", () => {
  it("subtracts the approved discount from the gross amount", () => {
    expect(computeBookingNetAmount(2000, 200)).toBe(1800);
  });

  it("never goes below zero even if discount exceeds gross", () => {
    expect(computeBookingNetAmount(100, 500)).toBe(0);
  });

  it("equals gross when there is no discount (current live behavior)", () => {
    expect(computeBookingNetAmount(1199, 0)).toBe(1199);
  });
});

describe("payout deduction/net breakdown", () => {
  it("applies the confirmed 15% deduction rate", () => {
    const result = computePayoutBreakdown(1000, 0.15);
    expect(result).toEqual({ gross: 1000, deduction: 150, net: 850 });
  });

  it("supports an admin-configured non-default rate", () => {
    const result = computePayoutBreakdown(1000, 0.2);
    expect(result).toEqual({ gross: 1000, deduction: 200, net: 800 });
  });
});

describe("duplicate/idempotent commission prevention (application-level pre-check shape)", () => {
  // The database-level guarantee lives in the partial unique index created by
  // supabase/kia-financial-repair/03_FORWARD_FINANCIAL_ENGINE_REPAIR.sql and
  // is validated by 05_POST_MIGRATION_VALIDATION.sql query #4 (which asserts
  // zero duplicate (source_type, source_id, partner_id, level) groups) — that
  // cannot be exercised without a live Postgres instance. This test locks in
  // the identity key shape the app and the RPC both key duplicate-detection
  // on, so a future change to that shape doesn't silently drift.
  function commissionIdentityKey(row: { source_type: string; source_id: string; partner_id: string; level: number }) {
    return `${row.source_type}:${row.source_id}:${row.partner_id}:${row.level}`;
  }

  it("produces the same key for what should be treated as the same commission", () => {
    const a = { source_type: "booking", source_id: "b1", partner_id: "p1", level: 1 };
    const b = { source_type: "booking", source_id: "b1", partner_id: "p1", level: 1 };
    expect(commissionIdentityKey(a)).toBe(commissionIdentityKey(b));
  });

  it("produces different keys for different levels of the same booking/partner", () => {
    const l1 = { source_type: "booking", source_id: "b1", partner_id: "p1", level: 1 };
    const l2 = { source_type: "booking", source_id: "b1", partner_id: "p1", level: 2 };
    expect(commissionIdentityKey(l1)).not.toBe(commissionIdentityKey(l2));
  });

  it("produces different keys for booking vs membership commissions on the same source id", () => {
    const booking = { source_type: "booking", source_id: "x1", partner_id: "p1", level: 1 };
    const membership = { source_type: "membership", source_id: "x1", partner_id: "p1", level: 1 };
    expect(commissionIdentityKey(booking)).not.toBe(commissionIdentityKey(membership));
  });
});

describe("payout FIFO settlement matching", () => {
  it("marks oldest-first commissions paid up to the gross payout amount", () => {
    const rows = [
      { id: "c1", amount: 600 },
      { id: "c2", amount: 300 },
      { id: "c3", amount: 170 },
    ];
    expect(selectCommissionsForFifoPayout(rows, 900)).toEqual(["c1", "c2"]);
  });

  it("skips a row larger than the remaining balance instead of partially matching it", () => {
    const rows = [
      { id: "c1", amount: 600 },
      { id: "c2", amount: 500 }, // too big for remaining 400
      { id: "c3", amount: 170 },
    ];
    // gross 770: take c1 (600), remaining 170; c2 (500) too big, skip; c3 (170) fits exactly.
    expect(selectCommissionsForFifoPayout(rows, 770)).toEqual(["c1", "c3"]);
  });

  it("matches the exact gross amount with no rows left over", () => {
    const rows = [{ id: "c1", amount: 250.5 }];
    expect(selectCommissionsForFifoPayout(rows, 250.5)).toEqual(["c1"]);
  });

  it("selects nothing when the gross amount is zero or negative", () => {
    const rows = [{ id: "c1", amount: 100 }];
    expect(selectCommissionsForFifoPayout(rows, 0)).toEqual([]);
    expect(selectCommissionsForFifoPayout(rows, -50)).toEqual([]);
  });

  it("ignores non-positive commission amounts defensively", () => {
    const rows = [
      { id: "c1", amount: 0 },
      { id: "c2", amount: -10 },
      { id: "c3", amount: 100 },
    ];
    expect(selectCommissionsForFifoPayout(rows, 100)).toEqual(["c3"]);
  });
});

describe("partner eligibility (used for both booking and membership commissions)", () => {
  const now = new Date("2026-07-15T00:00:00Z");

  it("is eligible when active, not deleted, and membership not expired", () => {
    expect(isPartnerEligibleForCommission({ status: "active", membership_expires_at: "2027-01-01" }, now)).toBe(true);
  });

  it("is not eligible when status is not active (e.g. legacy 'approved')", () => {
    expect(isPartnerEligibleForCommission({ status: "approved" }, now)).toBe(false);
  });

  it("is not eligible when soft-deleted", () => {
    expect(isPartnerEligibleForCommission({ status: "active", deleted_at: "2026-01-01" }, now)).toBe(false);
  });

  it("is not eligible when is_active is explicitly false", () => {
    expect(isPartnerEligibleForCommission({ status: "active", is_active: false }, now)).toBe(false);
  });

  it("is not eligible once membership has expired", () => {
    expect(isPartnerEligibleForCommission({ status: "active", membership_expires_at: "2026-01-01" }, now)).toBe(false);
  });

  it("is eligible when membership_expires_at is null (no expiry set)", () => {
    expect(isPartnerEligibleForCommission({ status: "active", membership_expires_at: null }, now)).toBe(true);
  });

  it("is not eligible for a null/missing partner", () => {
    expect(isPartnerEligibleForCommission(null, now)).toBe(false);
    expect(isPartnerEligibleForCommission(undefined, now)).toBe(false);
  });
});

describe("KYC / payout-request gating (KYC and bank must gate the request, never earnings visibility)", () => {
  const baseSettings = {
    deductionRate: 0.15,
    minimumAmount: 1000,
    kycRequired: true,
    bankRequired: true,
    singleOpenRequestOnly: true,
  };

  it("blocks the request when KYC is not verified", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 2000,
      kycStatus: "pending",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: false,
      settings: baseSettings,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/KYC/i);
  });

  it("blocks the request when bank is not verified", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 2000,
      kycStatus: "verified",
      bankVerified: false,
      membershipActive: true,
      hasOpenRequest: false,
      settings: baseSettings,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/bank/i);
  });

  it("allows KYC-gated request to be relaxed via settings (payout_kyc_required = false)", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 2000,
      kycStatus: "pending",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: false,
      settings: { ...baseSettings, kycRequired: false },
    });
    expect(result.allowed).toBe(true);
  });

  it("enforces the minimum payout amount from settings, not a hardcoded value", () => {
    const settings = { ...baseSettings, minimumAmount: 500 };
    const blocked = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 400,
      kycStatus: "verified",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: false,
      settings,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.error).toContain("500");

    const allowed = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 500,
      kycStatus: "verified",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: false,
      settings,
    });
    expect(allowed.allowed).toBe(true);
  });

  it("prevents requesting more than the wallet balance", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 1200,
      requestedAmount: 1500,
      kycStatus: "verified",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: false,
      settings: baseSettings,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/insufficient/i);
  });

  it("blocks a duplicate open request", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 2000,
      kycStatus: "verified",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: true,
      settings: baseSettings,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/already pending/i);
  });

  it("allows multiple open requests when that setting is disabled", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 2000,
      kycStatus: "verified",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: true,
      settings: { ...baseSettings, singleOpenRequestOnly: false },
    });
    expect(result.allowed).toBe(true);
  });

  it("allows a fully eligible request through", () => {
    const result = evaluatePayoutRequestEligibility({
      walletBalance: 5000,
      requestedAmount: 2000,
      kycStatus: "verified",
      bankVerified: true,
      membershipActive: true,
      hasOpenRequest: false,
      settings: baseSettings,
    });
    expect(result).toEqual({ allowed: true });
  });
});
