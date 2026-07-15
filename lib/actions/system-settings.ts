"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function getSystemSettings() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching system settings:", error);
    return null;
  }

  return data;
}

export async function updateSystemSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const maintenance_mode = formData.get("maintenance_mode") === "true";
  const payouts_enabled = formData.get("payouts_enabled") === "true";
  const commissions_enabled = formData.get("commissions_enabled") === "true";
  const bookings_enabled = formData.get("bookings_enabled") === "true";
  const membership_enabled = formData.get("membership_enabled") === "true";

  const updatePayload: Record<string, unknown> = {
    maintenance_mode,
    payouts_enabled,
    commissions_enabled,
    bookings_enabled,
    membership_enabled,
  };

  // These fields were added by supabase/kia-financial-repair — only include
  // them in the update if the submitting form actually sent them, so this
  // action still works against a database that hasn't run that repair yet.
  if (formData.has("payout_deduction_rate")) {
    updatePayload.payout_deduction_rate = Number(formData.get("payout_deduction_rate")) / 100;
  }
  if (formData.has("payout_minimum_amount")) {
    updatePayload.payout_minimum_amount = Number(formData.get("payout_minimum_amount"));
  }
  if (formData.has("membership_referral_bonus_amount")) {
    updatePayload.membership_referral_bonus_amount = Number(formData.get("membership_referral_bonus_amount"));
  }
  if (formData.has("payout_kyc_required")) {
    updatePayload.payout_kyc_required = formData.get("payout_kyc_required") === "true";
  }
  if (formData.has("payout_bank_required")) {
    updatePayload.payout_bank_required = formData.get("payout_bank_required") === "true";
  }
  if (formData.has("payout_single_open_request_only")) {
    updatePayload.payout_single_open_request_only = formData.get("payout_single_open_request_only") === "true";
  }

  const { data, error } = await supabase
    .from("system_settings")
    // Cast: payout_deduction_rate/payout_minimum_amount/etc. are added by
    // supabase/kia-financial-repair and are not yet present in the
    // generated lib/supabase/types.ts until types are regenerated.
    .update(updatePayload as any)
    .select()
    .single();

  if (error) {
    console.error("Error updating system settings:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/settings");

  return { data };
}
