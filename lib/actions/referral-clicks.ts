"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { resolvePartnerByCode } from "@/lib/actions/referral-tracking";

export async function trackReferralClick(referralCode: string, deviceType?: string) {
  const code = referralCode?.trim().toUpperCase();
  if (!code) return { success: false };

  const supabase = getSupabaseServiceClient();
  const partner = await resolvePartnerByCode(supabase, code);
  if (!partner) return { success: false };

  const { error } = await supabase.from("referral_clicks" as any).insert({
    partner_id: (partner as any).id,
    referral_code: (partner as any).partner_code,
    device_type: deviceType || null,
    converted_to_membership: false,
  });

  if (error) {
    console.error("Error tracking referral click:", error);
    return { success: false };
  }

  return { success: true };
}
