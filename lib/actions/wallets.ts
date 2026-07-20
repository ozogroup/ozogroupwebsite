"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

function normalizeProfile(row: any) {
  if (!row) return null;
  if (Array.isArray(row.profiles)) row.profiles = row.profiles[0] || null;
  return row;
}

export async function getAdminWalletDirectory() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const [{ data: partners }, { data: commissions }, { data: payouts }] = await Promise.all([
    supabase
      .from("partners")
      .select(`
        id,
        partner_code,
        profiles(full_name, phone, email),
        sponsor_id,
        status,
        kyc_status,
        wallet_balance,
        total_earnings,
        paid_earnings,
        bank_account_holder,
        bank_account_number,
        bank_ifsc,
        bank_name,
        bank_branch_name,
        upi_id,
        created_at
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("commissions")
      .select("partner_id, source_type, amount, status, level, reversed, deleted_at, created_at, paid_at")
      .is("deleted_at", null),
    supabase
      .from("payouts")
      .select("partner_id, amount, gross_amount, status, created_at"),
  ]);

  const partnerRows = (partners || []) as any[];
  for (const p of partnerRows) normalizeProfile(p);
  const byId = new Map(partnerRows.map((p) => [p.id, p]));

  const commissionRows = (commissions || []) as any[];
  const payoutRows = (payouts || []) as any[];

  type WalletEntry = {
    membershipReward: number;
    l1Income: number;
    l2Income: number;
    l3Income: number;
    l4Income: number;
    bookingCommission: number;
    totalGenerated: number;
    pendingEarnings: number;
    approvedEarnings: number;
    paidEarnings: number;
    reservedPayout: number;
    paidPayout: number;
    lastEarningDate: string | null;
    lastPayoutDate: string | null;
  };

  const walletMap = new Map<string, WalletEntry>();

  function getEntry(partnerId: string): WalletEntry {
    let entry = walletMap.get(partnerId);
    if (!entry) {
      entry = {
        membershipReward: 0, l1Income: 0, l2Income: 0, l3Income: 0, l4Income: 0,
        bookingCommission: 0, totalGenerated: 0, pendingEarnings: 0, approvedEarnings: 0,
        paidEarnings: 0, reservedPayout: 0, paidPayout: 0,
        lastEarningDate: null, lastPayoutDate: null,
      };
      walletMap.set(partnerId, entry);
    }
    return entry;
  }

  for (const c of commissionRows) {
    if (c.reversed) continue;
    if (!["pending", "approved", "paid"].includes(c.status)) continue;
    const amount = Number(c.amount || 0);
    const entry = getEntry(c.partner_id);
    entry.totalGenerated += amount;

    if (c.source_type === "membership") {
      entry.membershipReward += amount;
    } else {
      entry.bookingCommission += amount;
      const level = Number(c.level || 1);
      if (level === 1) entry.l1Income += amount;
      else if (level === 2) entry.l2Income += amount;
      else if (level === 3) entry.l3Income += amount;
      else if (level >= 4) entry.l4Income += amount;
    }

    if (c.status === "pending") entry.pendingEarnings += amount;
    else if (c.status === "approved") entry.approvedEarnings += amount;
    else if (c.status === "paid") entry.paidEarnings += amount;

    if (c.created_at && (!entry.lastEarningDate || c.created_at > entry.lastEarningDate)) {
      entry.lastEarningDate = c.created_at;
    }
  }

  for (const p of payoutRows) {
    const entry = getEntry(p.partner_id);
    if (["requested", "processing"].includes(p.status)) {
      entry.reservedPayout += Number(p.amount || 0);
    }
    if (p.status === "paid") {
      entry.paidPayout += Number(p.amount || 0);
      if (p.created_at && (!entry.lastPayoutDate || p.created_at > entry.lastPayoutDate)) {
        entry.lastPayoutDate = p.created_at;
      }
    }
  }

  return partnerRows.map((partner) => {
    const sponsor = partner.sponsor_id ? byId.get(partner.sponsor_id) : null;
    const wallet = walletMap.get(partner.id) || {
      membershipReward: 0, l1Income: 0, l2Income: 0, l3Income: 0, l4Income: 0,
      bookingCommission: 0, totalGenerated: 0, pendingEarnings: 0, approvedEarnings: 0,
      paidEarnings: 0, reservedPayout: 0, paidPayout: 0,
      lastEarningDate: null, lastPayoutDate: null,
    };
    return {
      id: partner.id,
      partner_code: partner.partner_code,
      name: partner.profiles?.full_name || "Unnamed",
      phone: partner.profiles?.phone || "-",
      email: partner.profiles?.email || "-",
      sponsor_name: sponsor?.profiles?.full_name || null,
      sponsor_code: sponsor?.partner_code || null,
      status: partner.status,
      kyc_status: partner.kyc_status,
      wallet_balance: Number(partner.wallet_balance || 0),
      lifetime_earnings: Number(partner.total_earnings || 0),
      payment_method: partner.upi_id ? "upi" : partner.bank_account_number ? "bank" : "none",
      bank_account_holder: partner.bank_account_holder || null,
      bank_account_number: partner.bank_account_number || null,
      bank_ifsc: partner.bank_ifsc || null,
      bank_name: partner.bank_name || null,
      bank_branch_name: partner.bank_branch_name || null,
      upi_id: partner.upi_id || null,
      ...wallet,
    };
  });
}
