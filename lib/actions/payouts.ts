"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// PAYOUTS ACTIONS
// =====================================================

const PAYOUT_DEDUCTION_RATE = 0.15;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getPayouts() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("payouts" as any)
    .select(`
      *,
      partner:partners(partner_code, bank_account_holder, bank_account_number, bank_ifsc, bank_name, upi_id, profiles(full_name))
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
      .select("partner_id, amount, source_type, status, reversed, is_active"),
    supabase
      .from("payouts" as any)
      .select("partner_id, amount, gross_amount, status"),
    supabase
      .from("partners" as any)
      .select("id, partner_code, wallet_balance, bank_account_holder, bank_account_number, bank_ifsc, bank_name, upi_id, profiles(full_name)")
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
      (c: any) => c.partner_id === partnerId && c.is_active !== false && !c.reversed && c.status !== "rejected"
    );
    const membershipIncome = partnerCommissions
      .filter((c: any) => c.source_type === "membership")
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const productIncome = partnerCommissions
      .filter((c: any) => ["booking", "product", "kit", "treatment"].includes(String(c.source_type || "").toLowerCase()))
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const bonusIncome = partnerCommissions
      .filter((c: any) => ["bonus", "milestone"].includes(String(c.source_type || "").toLowerCase()))
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
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

    summaryByPartner.set(partnerId, {
      membershipIncome,
      productIncome,
      bonusIncome,
      grossIncome,
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
    const grossAmount = Number(payout.gross_amount || payout.available_balance || payout.amount || 0);
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

  const payoutPartnerIds = new Set(payouts.map((p: any) => p.partner_id));
  for (const partnerId of partnerIds) {
    if (payoutPartnerIds.has(partnerId)) continue;
    const summary = summaryByPartner.get(partnerId);
    if (!summary || summary.grossIncome <= 0) continue;
    const partner = (partners || []).find((p: any) => p.id === partnerId) as any;
    rows.push({
      id: `summary-${partnerId}`,
      partner_id: partnerId,
      partner,
      amount: Math.max(0, summary.netPayable - summary.paidAmount),
      gross_amount: summary.grossIncome,
      deduction_rate: PAYOUT_DEDUCTION_RATE,
      deduction_amount: summary.deductionAmount,
      net_amount: summary.netPayable,
      available_balance: Number(partner?.wallet_balance || 0),
      payment_method: partner?.upi_id ? "upi" : "bank",
      payment_details: [
        partner?.bank_account_holder,
        partner?.bank_name,
        partner?.bank_account_number,
        partner?.bank_ifsc,
        partner?.upi_id ? `UPI: ${partner.upi_id}` : null,
      ].filter(Boolean).join(" | "),
      status: summary.netPayable - summary.paidAmount > 0 ? "available" : "settled",
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
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  
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
    const grossDebit = Number(payout.gross_amount || payout.available_balance || payout.amount || 0);
    const { data: partner } = await supabase
      .from("partners" as any)
      .select("wallet_balance, paid_earnings")
      .eq("id", payout.partner_id)
      .maybeSingle();

    if (partner) {
      await supabase
        .from("partners" as any)
        .update({
          wallet_balance: Math.max(0, Number((partner as any).wallet_balance || 0) - grossDebit),
          paid_earnings: Number((partner as any).paid_earnings || 0) + Number(payout.amount || 0),
          updated_at: now,
        })
        .eq("id", payout.partner_id);
    }
  }
  
  revalidatePath("/admin/payouts");
  return data;
}

export async function createPayout(payout: any) {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  
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
  const supabase = getSupabaseServerClient();

  const [{ data: partner }, { data: kyc }, { data: payouts }] = await Promise.all([
    supabase
      .from("partners" as any)
      .select("wallet_balance,kyc_status,bank_verified,membership_expires_at,status,bank_account_holder,bank_account_number,bank_ifsc,bank_name,upi_id")
      .eq("id", profile.id)
      .single(),
    supabase
      .from("partner_kyc" as any)
      .select("*")
      .eq("partner_id", profile.id)
      .maybeSingle(),
    supabase
      .from("payouts" as any)
      .select("*")
      .eq("partner_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  return { partner: partner as any, kyc: kyc as any, payouts: payouts || [] };
}

export async function requestPartnerPayout(amount: number, paymentMethod?: "bank" | "upi") {
  const profile = await requirePartner();
  const supabase = getSupabaseServerClient();

  const [{ data: partner, error }, { data: kyc }] = await Promise.all([
    supabase
      .from("partners" as any)
      .select("wallet_balance,kyc_status,bank_verified,membership_expires_at,status,bank_account_holder,bank_account_number,bank_ifsc,bank_name,upi_id")
      .eq("id", profile.id)
      .single(),
    supabase
      .from("partner_kyc" as any)
      .select("*")
      .eq("partner_id", profile.id)
      .maybeSingle(),
  ]);

  if (error || !partner) return { error: "Partner profile not found." };

  const p = partner as any;
  const k = kyc as any;
  const wallet = Number(p.wallet_balance || 0);
  const membershipActive = p.status === "active" && (!p.membership_expires_at || new Date(p.membership_expires_at).getTime() >= Date.now());
  const hasBank = Boolean(p.bank_account_holder && p.bank_name && p.bank_account_number && p.bank_ifsc);
  const upiId = k?.upi_id || p.upi_id;
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

  const paymentDetails =
    method === "upi"
      ? [
          k?.upi_holder_name ? `Holder: ${k.upi_holder_name}` : null,
          k?.upi_mobile ? `Mobile: ${k.upi_mobile}` : null,
          `UPI: ${upiId}`,
          k?.upi_app ? `App: ${k.upi_app}` : null,
        ].filter(Boolean).join(" | ")
      : [
          p.bank_account_holder,
          p.bank_name,
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

  let { error: insertError } = await supabase.from("payouts" as any).insert(payoutPayload);

  if (insertError && /gross_amount|deduction_rate|deduction_amount|net_amount/i.test(insertError.message || "")) {
    const fallbackPayload = {
      partner_id: profile.id,
      amount: netAmount,
      available_balance: wallet,
      payment_method: method,
      payment_details: `${paymentDetails} | Gross: Rs. ${grossAmount.toLocaleString("en-IN")} | 15% deduction: Rs. ${deductionAmount.toLocaleString("en-IN")}`,
      status: "requested",
    };
    const fallbackResult = await supabase.from("payouts" as any).insert(fallbackPayload);
    insertError = fallbackResult.error;
  }

  if (insertError) return { error: insertError.message };

  revalidatePath("/partner/payouts");
  revalidatePath("/admin/payouts");
  return { success: true };
}
