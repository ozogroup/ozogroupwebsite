"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { generateBookingCommissions } from "@/lib/actions/referral-tracking";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { syncCommissionUpdated } from "@/lib/integrations/google-sheet-sync";

type CommissionRow = {
  id: string;
  partner_id: string;
  amount: number | null;
  level: number | null;
  status: string | null;
  reversed: boolean | null;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

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
    transaction_type: "commission_reversal",
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

  if (bookingIds.length === 0) return rows;

  const { data: bookings, error: bookingError } = await supabase
    .from("bookings" as any)
    .select("id, booking_id, treatment_order_id, customer_name, customer_phone, treatment_name, payment_amount, treatment_price, booking_status, payment_status, partner_code")
    .in("id", Array.from(new Set(bookingIds)));

  if (bookingError) {
    console.error("Error enriching commissions with bookings:", bookingError);
    return rows;
  }

  const bookingMap = new Map((bookings || []).map((booking: any) => [booking.id, booking]));
  return rows.map((row: any) => ({
    ...row,
    source_booking: row.source_type === "booking" ? bookingMap.get(row.source_id) || null : null,
  }));
}

export async function generateMissingBookingCommissions() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: bookings, error } = await supabase
    .from("bookings" as any)
    .select("id, referred_by, referral_code, partner_code, payment_amount, treatment_price, booking_status, payment_status")
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

// Approve a pending commission: credit the partner wallet exactly once.
export async function approveCommission(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
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
