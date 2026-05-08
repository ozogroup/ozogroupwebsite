/**
 * Referrals data access layer (placeholder).
 *
 * Will expose:
 *  - createReferral(payload)
 *  - listReferralsForPartner(partnerId)
 *  - listReferralsForAdmin(filters)
 *  - markReferralPaid(id)
 *
 * Implementation pending creation of `referrals` table.
 */

export type ReferralStatus = "pending" | "confirmed" | "paid" | "rejected";
