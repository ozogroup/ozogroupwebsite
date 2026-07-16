"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { generateBookingCommissions } from "@/lib/actions/referral-tracking";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { syncCommissionUpdated } from "@/lib/integrations/google-sheet-sync";
import { roundMoney } from "@/lib/finance";

type CommissionRow = {
  id: string;
  partner_id: string;
  amount: number | null;
  level: number | null;
  status: string | null;
  reversed: boolean | null;
};

function revalidateMoneyPaths() {
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/payouts");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reports");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/commissions");
  revalidatePath("/partner/income");
  revalidatePath("/partner/payouts");
}

async function loadCommission(supabase: any, id: string): Promise<CommissionRow> {
  const { data, error } = await supabase
    .from("commissions")
    .select("id, partner_id, amount, level, status, reversed")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Commission not found.");
  return data as CommissionRow;
}

async function creditWallet(supabase: any, commission: CommissionRow) {
  const amount = Number(commission.amount || 0);
  if (amount <= 0) return;
  const now = new Date().toISOString();
  const { data: partner, error } = await supabase
    .from("partners")
    .select("wallet_balance, total_earnings")
    .eq("id", commission.partner_id)
    .maybeSingle();
  if (error || !partner) throw error || new Error("Partner wallet could not be loaded.");
  const before = Number(partner.wallet_balance || 0);
  const after = roundMoney(before + amount);
  const { error: updateError } = await supabase
    .from("partners")
    .update({
      wallet_balance: after,
      total_earnings: roundMoney(Number(partner.total_earnings || 0) + amount),
      updated_at: now,
    })
    .eq("id", commission.partner_id);
  if (updateError) throw updateError;
  await supabase.from("wallet_transactions").insert({
    partner_id: commission.partner_id,
    transaction_type: "commission_credit",
    amount,
    balance_before: before,
    balance_after: after,
    reference_type: "commission",
    reference_id: commission.id,
    notes: `Commission level ${commission.level || 1} approved`,
  });
}

async function reverseWallet(supabase: any, commission: CommissionRow) {
  const amount = Number(commission.amount || 0);
  if (amount <= 0) return;
  const now = new Date().toISOString();
  const { data: partner, error } = await supabase
    .from("partners")
    .select("wallet_balance, total_earnings")
    .eq("id", commission.partner_id)
    .maybeSingle();
  if (error || !partner) throw error || new Error("Partner wallet could not be loaded.");
  const before = Number(partner.wallet_balance || 0);
  if (before + 0.009 < amount) {
    throw new Error("Cannot reverse this commission: the amount has already been withdrawn from the wallet.");
  }
  const after = roundMoney(Math.max(0, before - amount));
  const { error: updateError } = await supabase
    .from("partners")
    .update({
      wallet_balance: after,
      total_earnings: roundMoney(Math.max(0, Number(partner.total_earnings || 0) - amount)),
      updated_at: now,
    })
    .eq("id", commission.partner_id);
  if (updateError) throw updateError;
  await supabase.from("wallet_transactions").insert({
    partner_id: commission.partner_id,
    transaction_type: "adjustment_debit",
    amount,
    balance_before: before,
    balance_after: after,
    reference_type: "commission",
    reference_id: commission.id,
    notes: `Commission level ${commission.level || 1} reversed`,
  });
}

// =====================================================
// COMMISSIONS ACTIONS
// =====================================================

export async function getCommissions() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("commissions" as any)
    .select(`
      *,
      partner:partners(partner_code, profiles(full_name))
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching commissions:", error);
    return [];
  }

  const rows = data || [];
  const bookingIds = rows
    .filter((row: any) => row.source_type === "booking" && row.source_id)
    .map((row: any) => row.source_id);
  const membershipIds = rows
    .filter((row: any) => row.source_type === "membership" && row.source_id)
    .map((row: any) => row.source_id);

  const [bookingsResult, membershipsResult] = await Promise.all([
    bookingIds.length > 0
      ? supabase
          .from("bookings" as any)
          .select("id, booking_id, treatment_order_id, customer_name, customer_phone, treatment_name, payment_amount, treatment_price, booking_status, payment_status, partner_code")
          .in("id", Array.from(new Set(bookingIds)))
      : Promise.resolve({ data: [] as any[], error: null }),
    // Membership commissions (the flat new-member referral bonus) need the
    // new member's identity resolved so the admin can see WHO was referred,
    // not just a raw membership UUID.
    membershipIds.length > 0
      ? supabase
          .from("memberships" as any)
          .select("id, membership_id, full_name, mobile, email, city, membership_status, payment_status, sponsor_id")
          .in("id", Array.from(new Set(membershipIds)))
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  if (bookingsResult.error) {
    console.error("Error enriching commissions with bookings:", bookingsResult.error);
  }
  if (membershipsResult.error) {
    console.error("Error enriching commissions with memberships:", membershipsResult.error);
  }

  const bookingMap = new Map((bookingsResult.data || []).map((booking: any) => [booking.id, booking]));
  const membershipMap = new Map((membershipsResult.data || []).map((membership: any) => [membership.id, membership]));

  return rows.map((row: any) => ({
    ...row,
    source_booking: row.source_type === "booking" ? bookingMap.get(row.source_id) || null : null,
    source_membership: row.source_type === "membership" ? membershipMap.get(row.source_id) || null : null,
  }));
}

export async function generateMissingBookingCommissions() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: bookings, error } = await supabase
    .from("bookings" as any)
    .select("id, referred_by, referral_code, partner_code, payment_amount, treatment_price, net_amount, booking_status, payment_status")
    .eq("payment_status", "paid")
    .in("booking_status", ["confirmed", "completed"])
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Error loading bookings for commission generation:", error);
    throw new Error(error.message || "Unable to load eligible bookings.");
  }

  let processed = 0;
  for (const booking of ((bookings || []) as any[])) {
    await generateBookingCommissions(supabase, {
      id: booking.id,
      referred_by: booking.referred_by,
      referral_code: booking.referral_code,
      partner_code: booking.partner_code,
      payment_amount: Number(booking.payment_amount ?? booking.treatment_price ?? 0),
      net_amount: booking.net_amount,
      booking_status: booking.booking_status,
      payment_status: booking.payment_status,
    });
    processed += 1;
  }

  revalidateMoneyPaths();

  return {
    scanned: bookings?.length || 0,
    processed,
  };
}

export async function generateMissingMembershipReferralCommissions() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: settings } = await supabase
    .from("system_settings" as any)
    .select("membership_referral_bonus_amount")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const bonusAmount = Number((settings as any)?.membership_referral_bonus_amount ?? 500);
  if (!(bonusAmount > 0)) {
    throw new Error("Membership referral bonus amount is not configured.");
  }

  const { data: memberships, error } = await supabase
    .from("memberships" as any)
    .select("id, amount, payment_amount, sponsor_id, membership_status, payment_status")
    .eq("membership_status", "active")
    .eq("payment_status", "paid")
    .not("sponsor_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Error loading memberships for referral commission generation:", error);
    throw new Error(error.message || "Unable to load eligible memberships.");
  }

  let scanned = 0;
  let created = 0;
  for (const membership of ((memberships || []) as any[])) {
    scanned += 1;
    const sponsorId = membership.sponsor_id;
    if (!sponsorId) continue;

    const { data: existing, error: existingError } = await supabase
      .from("commissions" as any)
      .select("id")
      .eq("source_type", "membership")
      .eq("source_id", membership.id)
      .eq("partner_id", sponsorId)
      .eq("level", 1)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking membership referral commission:", existingError);
      continue;
    }
    if (existing) continue;

    const { data: sponsor } = await supabase
      .from("partners" as any)
      .select("status, is_active, deleted_at, membership_expires_at")
      .eq("id", sponsorId)
      .maybeSingle();
    const sp = sponsor as any;
    const sponsorEligible =
      sp &&
      sp.status === "active" &&
      sp.is_active !== false &&
      !sp.deleted_at &&
      (!sp.membership_expires_at || new Date(sp.membership_expires_at).getTime() >= Date.now());
    if (!sponsorEligible) continue;

    const { error: insertError } = await supabase.from("commissions" as any).insert({
      partner_id: sponsorId,
      source_type: "membership",
      source_id: membership.id,
      source_amount: Number(membership.payment_amount ?? membership.amount ?? 0),
      level: 1,
      percentage: 0,
      amount: bonusAmount,
      status: "pending",
    });

    if (insertError) {
      if (insertError.code === "23505") continue;
      console.error("Error creating missing membership referral commission:", insertError);
      continue;
    }
    created += 1;
  }

  revalidateMoneyPaths();

  return { scanned, created, bonusAmount };
}

// Change a commission's status via the atomic, row-locked
// kia_set_commission_status RPC (see supabase/kia-financial-repair). Falls
// back to the unlocked JS read-then-write path only if that RPC is missing
// from the database, matching this codebase's existing RPC-first/JS-fallback
// convention (see generateBookingCommissionsViaRpc, updatePayoutStatus).
async function setCommissionStatusViaRpc(supabase: any, id: string, status: "approved" | "rejected") {
  const { data, error } = await supabase.rpc("kia_set_commission_status", {
    commission_id_input: id,
    new_status_input: status,
  });

  if (error) {
    const message = `${error.message || ""} ${error.details || ""}`;
    if (/kia_set_commission_status|function .* does not exist|schema cache/i.test(message)) {
      return { handled: false as const };
    }
    throw error;
  }

  return { handled: true as const, data };
}

// Approve a pending commission: credit the partner wallet exactly once.
export async function approveCommission(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const rpcResult = await setCommissionStatusViaRpc(supabase, id, "approved");
  if (rpcResult.handled) {
    const data = rpcResult.data as any;
    await syncCommissionUpdated({
      id: data.id,
      source_id: data.source_id,
      partner_id: data.partner_id,
      level: data.level || 1,
      amount: data.amount || 0,
      status: "approved",
      updated_at: data.updated_at,
    });
    revalidateMoneyPaths();
    return data;
  }

  const commission = await loadCommission(supabase, id);

  if (commission.status === "approved") return commission;
  if (commission.status === "paid") {
    throw new Error("This commission has already been paid out and cannot be re-approved.");
  }
  if (commission.status !== "pending") {
    throw new Error(`A ${commission.status || "unknown"} commission cannot be approved.`);
  }

  const { data, error } = await supabase
    .from("commissions" as any)
    .update({ status: "approved", reversed: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Credit the wallet only when transitioning from a non-credited state.
  await creditWallet(supabase, commission);

  await syncCommissionUpdated({
    id: (data as any).id,
    source_id: (data as any).source_id,
    partner_id: commission.partner_id,
    level: commission.level || 1,
    amount: commission.amount || 0,
    status: "approved",
    updated_at: (data as any).updated_at,
  });

  revalidateMoneyPaths();
  return data;
}

// Reject a commission: reverse the wallet credit if it was previously approved.
export async function rejectCommission(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const rpcResult = await setCommissionStatusViaRpc(supabase, id, "rejected");
  if (rpcResult.handled) {
    const data = rpcResult.data as any;
    await syncCommissionUpdated({
      id: data.id,
      source_id: data.source_id,
      partner_id: data.partner_id,
      level: data.level || 1,
      amount: data.amount || 0,
      status: "rejected",
      updated_at: data.updated_at,
    });
    revalidateMoneyPaths();
    return data;
  }

  const commission = await loadCommission(supabase, id);

  if (commission.status === "rejected") return commission;
  if (commission.status === "paid") {
    throw new Error("This commission has already been paid out and cannot be rejected.");
  }
  if (!["pending", "approved"].includes(String(commission.status))) {
    throw new Error(`A ${commission.status || "unknown"} commission cannot be rejected.`);
  }

  if (commission.status === "approved") {
    await reverseWallet(supabase, commission);
  }

  const { data, error } = await supabase
    .from("commissions" as any)
    .update({ status: "rejected", reversed: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await syncCommissionUpdated({
    id: (data as any).id,
    source_id: (data as any).source_id,
    partner_id: commission.partner_id,
    level: commission.level || 1,
    amount: commission.amount || 0,
    status: "rejected",
    updated_at: (data as any).updated_at,
  });

  revalidateMoneyPaths();
  return data;
}

// Revert a commission back to pending (reverses wallet credit if it was approved).
export async function revertCommissionToPending(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const commission = await loadCommission(supabase, id);

  if (commission.status === "pending") return commission;
  throw new Error(`A ${commission.status || "unknown"} commission cannot be reset to pending.`);
}

// Safe router used by the admin Commissions screen. Wallet effects are handled
// by the dedicated helpers above. "paid" is set automatically when a payout is
// marked paid (see lib/actions/payouts.ts) and cannot be set manually here.
export async function updateCommissionStatus(id: string, status: string) {
  switch (status) {
    case "approved":
      return approveCommission(id);
    case "rejected":
      return rejectCommission(id);
    case "pending":
      return revertCommissionToPending(id);
    case "paid":
      throw new Error("Commissions are marked paid automatically when the related payout is paid.");
    default:
      throw new Error(`Unsupported commission status: ${status}`);
  }
}
