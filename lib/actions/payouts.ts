"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// PAYOUTS ACTIONS
// =====================================================

export async function getPayouts() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("payouts" as any)
    .select(`
      *,
      partner:partners(partner_code, profiles(full_name))
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching payouts:", error);
    return [];
  }
  
  return data || [];
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
  if (wallet < 1000) return { error: "Minimum wallet balance for payout is ₹1000." };
  if (!Number.isFinite(amount) || amount < 1000) return { error: "Minimum payout amount is ₹1000." };
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

  const { error: insertError } = await supabase.from("payouts" as any).insert({
    partner_id: profile.id,
    amount,
    available_balance: wallet,
    payment_method: method,
    payment_details: paymentDetails,
    status: "requested",
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/partner/payouts");
  revalidatePath("/admin/payouts");
  return { success: true };
}
