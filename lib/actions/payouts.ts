"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { syncPayoutUpdated } from "@/lib/integrations/google-sheet-sync";

// =====================================================
// PAYOUTS ACTIONS
// =====================================================

const PAYOUT_DEDUCTION_RATE = 0.15;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

// When a payout is paid, move the partner's oldest approved commissions into the
// "paid" state (FIFO) up to the gross payout amount. This keeps the commission
// lifecycle (pending -> approved -> paid) consistent with wallet movements.
// Status-only update; wallet_balance/paid_earnings are handled by the payout flow.
async function markApprovedCommissionsPaid(
  supabase: any,
  partnerId: string,
  grossAmount: number,
  payoutId: string
) {
  if (!partnerId || !payoutId || !(grossAmount > 0)) return;
  const { data: rows, error } = await supabase
    .from("commissions" as any)
    .select("id, amount")
    .eq("partner_id", partnerId)
    .eq("status", "approved")
    .eq("reversed", false)
    .is("deleted_at", null)
    .is("payout_id", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!Array.isArray(rows) || rows.length === 0) return;

  let remaining = grossAmount;
  const ids: string[] = [];
  for (const row of rows) {
    if (remaining <= 0.009) break;
    const amount = Number(row.amount || 0);
    if (amount <= 0 || amount > remaining + 0.009) continue;
    ids.push(row.id);
    remaining = roundMoney(remaining - amount);
  }
  if (ids.length === 0) return;
  const { error: updateError } = await supabase
    .from("commissions" as any)
    .update({ status: "paid", payout_id: payoutId, updated_at: new Date().toISOString() })
    .eq("status", "approved")
    .eq("reversed", false)
    .is("deleted_at", null)
    .is("payout_id", null)
    .in("id", ids);
  if (updateError) throw updateError;
}

export async function getPayouts() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("payouts" as any)
    .select(`
      *,
      partner:partners(partner_code, bank_account_holder, bank_account_number, bank_ifsc, upi_id, profiles(full_name))
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching payouts:", error);
    return [];
  }
  
  const payouts = data || [];
  const [{ data: commissions }, { data: allPayouts }, { data: partners }] = await Promise.all([
    supabase
      .from("commissions" as any)
      .select("partner_id, amount, source_type, status, reversed, deleted_at")
      .is("deleted_at", null),
    supabase
      .from("payouts" as any)
      .select("partner_id, amount, gross_amount, status"),
    supabase
      .from("partners" as any)
      .select("id, partner_code, wallet_balance, total_earnings, paid_earnings, bank_account_holder, bank_account_number, bank_ifsc, upi_id, profiles(full_name)")
  ]);

  const partnerIds = Array.from(
    new Set([
      ...payouts.map((p: any) => p.partner_id),
      ...(commissions || []).map((c: any) => c.partner_id),
      ...(partners || []).filter((p: any) => Number(p.wallet_balance || 0) > 0).map((p: any) => p.id),
    ].filter(Boolean))
  );

  const summaryByPartner = new Map<string, any>();
  for (const partnerId of partnerIds) {
    const partnerCommissions = (commissions || []).filter(
      (c: any) =>
        c.partner_id === partnerId &&
        !c.reversed &&
        c.deleted_at == null &&
        ["approved", "paid"].includes(String(c.status))
    );
    const membershipIncome = partnerCommissions
      .filter((c: any) => c.source_type === "membership")
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const productIncome = partnerCommissions
      .filter((c: any) => c.source_type === "booking")
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const bonusIncome = 0;
    const grossIncome = membershipIncome + productIncome + bonusIncome;
    const deductionAmount = roundMoney(grossIncome * PAYOUT_DEDUCTION_RATE);
    const netPayable = roundMoney(grossIncome - deductionAmount);
    const partnerPayouts = (allPayouts || []).filter((p: any) => p.partner_id === partnerId);
    const paidAmount = partnerPayouts
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const requestedPayout = partnerPayouts
      .filter((p: any) => ["requested", "processing"].includes(p.status))
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const pendingPayout = Math.max(0, roundMoney(netPayable - paidAmount));
    const partner = (partners || []).find((p: any) => p.id === partnerId) as any;

    summaryByPartner.set(partnerId, {
      membershipIncome,
      productIncome,
      bonusIncome,
      grossIncome,
      walletBalance: Number(partner?.wallet_balance || 0),
      paidEarnings: Number(partner?.paid_earnings || 0),
      deductionRate: PAYOUT_DEDUCTION_RATE,
      deductionAmount,
      netPayable,
      paidAmount,
      pendingPayout,
      requestedPayout,
      payoutStatus: requestedPayout > 0 ? "pending" : pendingPayout > 0 ? "available" : paidAmount >= netPayable && netPayable > 0 ? "paid" : "open",
    });
  }

  const rows = payouts.map((payout: any) => {
    const grossAmount = Number(payout.gross_amount || payout.amount || 0);
    const deductionAmount = Number(payout.deduction_amount ?? roundMoney(grossAmount * PAYOUT_DEDUCTION_RATE));
    const netAmount = Number(payout.net_amount || payout.amount || roundMoney(grossAmount - deductionAmount));
    return {
      ...payout,
      gross_amount: grossAmount,
      deduction_rate: Number(payout.deduction_rate ?? PAYOUT_DEDUCTION_RATE),
      deduction_amount: deductionAmount,
      net_amount: netAmount,
      partner_summary: summaryByPartner.get(payout.partner_id),
    };
  });

  const openPayoutPartnerIds = new Set(
    payouts
      .filter((p: any) => ["requested", "processing"].includes(String(p.status || "")))
      .map((p: any) => p.partner_id)
  );
  for (const partnerId of partnerIds) {
    if (openPayoutPartnerIds.has(partnerId)) continue;
    const summary = summaryByPartner.get(partnerId);
    const partner = (partners || []).find((p: any) => p.id === partnerId) as any;
    const walletBalance = Number(partner?.wallet_balance || 0);
    if (!summary || walletBalance <= 0) continue;
    const walletDeduction = roundMoney(walletBalance * PAYOUT_DEDUCTION_RATE);
    const walletNet = roundMoney(walletBalance - walletDeduction);
    rows.push({
      id: `summary-${partnerId}`,
      partner_id: partnerId,
      partner,
      amount: walletNet,
      gross_amount: walletBalance,
      deduction_rate: PAYOUT_DEDUCTION_RATE,
      deduction_amount: walletDeduction,
      net_amount: walletNet,
      available_balance: walletBalance,
      payment_method: partner?.upi_id ? "upi" : "bank",
      payment_details: [
        partner?.bank_account_holder,
        partner?.bank_account_number,
        partner?.bank_ifsc,
        partner?.upi_id ? `UPI: ${partner.upi_id}` : null,
      ].filter(Boolean).join(" | "),
      status: "available",
      created_at: null,
      is_summary: true,
      partner_summary: summary,
    });
  }

  return rows.sort((a: any, b: any) => {
    if (a.is_summary !== b.is_summary) return a.is_summary ? 1 : -1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

export async function updatePayoutStatus(id: string, status: string, transactionReference?: string, note?: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data: existingPayout, error: existingError } = await supabase
    .from("payouts" as any)
    .select("*")
    .eq("id", id)
    .single();
  if (existingError || !existingPayout) throw existingError || new Error("Payout not found.");
  if ((existingPayout as any).status === "paid" && status === "paid") return existingPayout;
  if ((existingPayout as any).status === "paid") {
    throw new Error("A paid payout is final. A dedicated payout reversal is required before changing it.");
  }
  if ((existingPayout as any).status === "rejected" && status !== "rejected") {
    throw new Error("A rejected payout is final and cannot be reopened.");
  }
  
  const updateData: any = { 
    status, 
    updated_at: now,
    transaction_note: note || null,
  };
  
  if (transactionReference) {
    updateData.transaction_reference = transactionReference;
  }
  
  if (status === "processing") updateData.approved_at = now;
  if (status === "rejected") updateData.rejected_at = now;
  if (status === "paid") {
    updateData.paid_at = now;
    updateData.processed_at = now;
  }
  
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc("process_partner_payout", {
    payout_id_input: id,
    new_status_input: status,
    transaction_reference_input: transactionReference || null,
    transaction_note_input: note || null,
  });

  if (!rpcError) {
    if (status === "paid") {
      await markApprovedCommissionsPaid(
        supabase,
        (existingPayout as any).partner_id,
        Number((existingPayout as any).gross_amount || (existingPayout as any).amount || 0),
        (existingPayout as any).id
      );
    }

    await syncPayoutUpdated({
      id: (existingPayout as any).id,
      partner_id: (existingPayout as any).partner_id,
      amount: Number((existingPayout as any).amount || 0),
      status,
      payment_method: (existingPayout as any).payment_method,
      payment_reference: transactionReference || (existingPayout as any).transaction_reference,
      updated_at: now,
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/partner/payouts");
    revalidatePath("/partner/income");
    revalidatePath("/admin/commissions");
    revalidatePath("/partner/dashboard");
    return rpcData;
  }

  let fallbackPartner: any = null;
  let fallbackGrossDebit = 0;
  if (status === "paid") {
    fallbackGrossDebit = Number(
      (existingPayout as any).gross_amount ||
        (existingPayout as any).available_balance ||
        (existingPayout as any).amount ||
        0
    );
    const { data: partner, error: partnerReadError } = await supabase
      .from("partners" as any)
      .select("wallet_balance, paid_earnings")
      .eq("id", (existingPayout as any).partner_id)
      .maybeSingle();
    if (partnerReadError || !partner) {
      throw partnerReadError || new Error("Partner wallet could not be loaded.");
    }
    if (fallbackGrossDebit <= 0) throw new Error("Invalid payout amount.");
    if (fallbackGrossDebit > Number((partner as any).wallet_balance || 0)) {
      throw new Error("Partner wallet balance is lower than the requested gross payout.");
    }
    fallbackPartner = partner;
  }

  const { data, error } = await supabase
    .from("payouts" as any)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating payout status:", error);
    throw error;
  }

  if (status === "paid" && data) {
    const payout = data as any;
    const grossDebit = fallbackGrossDebit;
    const partner = fallbackPartner;

    if (partner) {
      const balanceBefore = Number(partner.wallet_balance || 0);
      const balanceAfter = Math.max(0, balanceBefore - grossDebit);
      const { error: partnerError } = await supabase
        .from("partners" as any)
        .update({
          wallet_balance: balanceAfter,
          paid_earnings: Number(partner.paid_earnings || 0) + Number(payout.amount || 0),
          updated_at: now,
        })
        .eq("id", payout.partner_id);
      if (partnerError) throw partnerError;

      await supabase.from("wallet_transactions" as any).insert({
        partner_id: payout.partner_id,
        transaction_type: "payout_debit",
        amount: grossDebit,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_type: "payout",
        reference_id: payout.id,
        notes: transactionReference ? `Paid: ${transactionReference}` : "Payout marked paid by admin",
      });

      await markApprovedCommissionsPaid(supabase, payout.partner_id, grossDebit, payout.id);
    }
  }

  await syncPayoutUpdated({
    id: (data as any).id,
    partner_id: (data as any).partner_id,
    amount: Number((data as any).amount || 0),
    status,
    payment_method: (data as any).payment_method,
    payment_reference: transactionReference || (data as any).transaction_reference,
    updated_at: now,
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/partner/payouts");
  revalidatePath("/partner/income");
  revalidatePath("/admin/commissions");
  revalidatePath("/partner/dashboard");
  return data;
}

export async function createPayout(payout: any) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("payouts" as any)
    .insert({
      ...payout,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating payout:", error);
    throw error;
  }
  
  revalidatePath("/admin/payouts");
  return data;
}

export async function getPartnerPayoutContext() {
  const profile = await requirePartner();
  const supabase = await getSupabaseServerClient();

  const [{ data: partner }, { data: payouts }] = await Promise.all([
    supabase
      .from("partners" as any)
      .select("wallet_balance,kyc_status,bank_verified,membership_expires_at,status,bank_account_holder,bank_account_number,bank_ifsc,upi_id")
      .eq("id", profile.id)
      .single(),
    supabase
      .from("payouts" as any)
      .select("*")
      .eq("partner_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  return { partner: partner as any, kyc: null, payouts: payouts || [] };
}

export async function requestPartnerPayout(amount: number, paymentMethod?: "bank" | "upi") {
  const profile = await requirePartner();
  const supabase = getSupabaseServiceClient();

  const { data: partner, error } = await supabase
    .from("partners" as any)
    .select("wallet_balance,kyc_status,bank_verified,membership_expires_at,status,bank_account_holder,bank_account_number,bank_ifsc,upi_id")
    .eq("id", profile.id)
    .single();

  if (error || !partner) return { error: "Partner profile not found." };

  const p = partner as any;
  const wallet = Number(p.wallet_balance || 0);
  const membershipActive = p.status === "active" && (!p.membership_expires_at || new Date(p.membership_expires_at).getTime() >= Date.now());
  const hasBank = Boolean(p.bank_account_holder && p.bank_account_number && p.bank_ifsc);
  const upiId = p.upi_id;
  const hasUpi = Boolean(upiId);
  const method = paymentMethod || (hasBank ? "bank" : hasUpi ? "upi" : "bank");

  if (p.kyc_status !== "verified") return { error: "KYC approval is required before withdrawal." };
  if (!p.bank_verified) return { error: "Bank details must be verified before withdrawal." };
  if (!membershipActive) return { error: "Membership must be active before withdrawal." };
  if (wallet < 1000) return { error: "Minimum wallet balance for payout is Rs. 1000." };
  if (!Number.isFinite(amount) || amount < 1000) return { error: "Minimum payout amount is Rs. 1000." };
  if (amount > wallet) return { error: "Insufficient wallet balance." };
  if (method === "bank" && !hasBank) return { error: "Bank details are required for bank transfer." };
  if (method === "upi" && !hasUpi) return { error: "UPI details are required for UPI payout." };

  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("payouts" as any)
    .select("id, gross_amount, amount, status")
    .eq("partner_id", profile.id)
    .in("status", ["requested", "processing"])
    .limit(1)
    .maybeSingle();
  if (existingRequestError) return { error: existingRequestError.message };
  if (existingRequest) {
    return { error: "A payout request is already pending. Please wait for the admin to process it." };
  }

  const paymentDetails =
    method === "upi"
      ? [
          `UPI: ${upiId}`,
        ].filter(Boolean).join(" | ")
      : [
          p.bank_account_holder,
          p.bank_account_number,
          p.bank_ifsc,
        ].filter(Boolean).join(" | ");

  const grossAmount = roundMoney(amount);
  const deductionAmount = roundMoney(grossAmount * PAYOUT_DEDUCTION_RATE);
  const netAmount = roundMoney(grossAmount - deductionAmount);
  const payoutPayload: Record<string, unknown> = {
    partner_id: profile.id,
    amount: netAmount,
    gross_amount: grossAmount,
    deduction_rate: PAYOUT_DEDUCTION_RATE,
    deduction_amount: deductionAmount,
    net_amount: netAmount,
    available_balance: wallet,
    payment_method: method,
    payment_details: paymentDetails,
    status: "requested",
  };

  let { data: insertedPayout, error: insertError } = await supabase
    .from("payouts" as any)
    .insert(payoutPayload)
    .select("id")
    .single();

  if (insertError && /gross_amount|deduction_rate|deduction_amount|net_amount/i.test(insertError.message || "")) {
    const fallbackPayload = {
      partner_id: profile.id,
      amount: netAmount,
      available_balance: wallet,
      payment_method: method,
      payment_details: `${paymentDetails} | Gross: Rs. ${grossAmount.toLocaleString("en-IN")} | 15% deduction: Rs. ${deductionAmount.toLocaleString("en-IN")}`,
      status: "requested",
    };
    const fallbackResult = await supabase
      .from("payouts" as any)
      .insert(fallbackPayload)
      .select("id")
      .single();
    insertedPayout = fallbackResult.data;
    insertError = fallbackResult.error;
  }

  if (insertError) return { error: insertError.message };

  await supabase.from("activity_logs" as any).insert({
    actor_id: profile.id,
    actor_role: "partner",
    action: "payout_requested",
    entity_type: "payout",
    entity_id: (insertedPayout as any)?.id || profile.id,
    new_value: { gross_amount: grossAmount, deduction_amount: deductionAmount, net_amount: netAmount, payment_method: method },
  });

  revalidatePath("/partner/payouts");
  revalidatePath("/admin/payouts");
  return { success: true };
}
