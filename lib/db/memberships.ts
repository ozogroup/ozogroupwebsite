/**
 * Memberships data access layer (placeholder).
 *
 * Will expose:
 *  - createMembership(payload)
 *  - getMembershipByPartner(partnerId)
 *  - listMembershipsForAdmin(filters)
 *  - updateMembershipStatus(id, status)
 *
 * Implementation pending creation of `memberships` table.
 */

export type MembershipStatus = "pending" | "active" | "expired" | "cancelled";
