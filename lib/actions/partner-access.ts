"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let pw = "";
  for (let i = 0; i < 12; i++) {
    pw += chars[bytes[i] % chars.length];
  }
  return pw;
}

export async function generatePartnerTempPassword(partnerId: string): Promise<{
  success: boolean;
  tempPassword?: string;
  error?: string;
}> {
  const admin = await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: partner, error: pErr } = await supabase
    .from("partners" as any)
    .select("id, partner_code, profiles(id, full_name, email)")
    .eq("id", partnerId)
    .maybeSingle();

  if (pErr || !partner) {
    return { success: false, error: "Partner not found." };
  }

  const profile = Array.isArray((partner as any).profiles)
    ? (partner as any).profiles[0]
    : (partner as any).profiles;
  const userId = profile?.id || partnerId;

  const tempPassword = generateTempPassword();

  const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });

  if (updateErr) {
    console.error("Failed to set temp password:", updateErr.message);
    return { success: false, error: `Failed to set password: ${updateErr.message}` };
  }

  await supabase.from("activity_logs" as any).insert({
    actor_id: (admin as any)?.id || null,
    actor_role: "admin",
    action: "temp_password_generated",
    entity_type: "partner",
    entity_id: partnerId,
    new_value: { partner_code: (partner as any).partner_code },
  });

  return { success: true, tempPassword };
}

export async function togglePartnerAccount(
  partnerId: string,
  activate: boolean
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: partner, error: pErr } = await supabase
    .from("partners" as any)
    .select("id, partner_code, status, profiles(id)")
    .eq("id", partnerId)
    .maybeSingle();

  if (pErr || !partner) {
    return { success: false, error: "Partner not found." };
  }

  const profile = Array.isArray((partner as any).profiles)
    ? (partner as any).profiles[0]
    : (partner as any).profiles;
  const userId = profile?.id || partnerId;

  if (activate) {
    const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
    if (authErr) {
      return { success: false, error: `Failed to activate: ${authErr.message}` };
    }
    await supabase
      .from("partners" as any)
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", partnerId);
  } else {
    const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876600h",
    });
    if (authErr) {
      return { success: false, error: `Failed to deactivate: ${authErr.message}` };
    }
    await supabase
      .from("partners" as any)
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", partnerId);
  }

  await supabase.from("activity_logs" as any).insert({
    actor_id: (admin as any)?.id || null,
    actor_role: "admin",
    action: activate ? "partner_activated" : "partner_deactivated",
    entity_type: "partner",
    entity_id: partnerId,
    new_value: { partner_code: (partner as any).partner_code },
  });

  revalidatePath("/admin/kyc");
  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function getPartnerAccessInfo(partnerId: string): Promise<{
  success: boolean;
  data?: {
    partner_code: string;
    email: string;
    phone: string;
    status: string;
    last_sign_in: string | null;
    login_url: string;
  };
  error?: string;
}> {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: partner, error: pErr } = await supabase
    .from("partners" as any)
    .select("id, partner_code, status, profiles(id, email, phone)")
    .eq("id", partnerId)
    .maybeSingle();

  if (pErr || !partner) {
    return { success: false, error: "Partner not found." };
  }

  const profile = Array.isArray((partner as any).profiles)
    ? (partner as any).profiles[0]
    : (partner as any).profiles;
  const userId = profile?.id || partnerId;

  let lastSignIn: string | null = null;
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    lastSignIn = authUser?.user?.last_sign_in_at || null;
  } catch {
    // non-fatal
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kiaskincare.com";

  return {
    success: true,
    data: {
      partner_code: (partner as any).partner_code,
      email: profile?.email || "",
      phone: profile?.phone || "",
      status: (partner as any).status || "unknown",
      last_sign_in: lastSignIn,
      login_url: `${baseUrl}/login`,
    },
  };
}
