"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";

// =====================================================
// PARTNERS ACTIONS
// =====================================================

export async function getPartners() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("partners" as any)
    .select("*, profiles(full_name, phone, email)")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching partners:", error);
    return [];
  }
  
  return data || [];
}

export async function getPartnerById(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("partners" as any)
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching partner:", error);
    return null;
  }
  
  return data;
}

export async function updatePartnerStatus(id: string, status: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("partners" as any)
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating partner status:", error);
    throw error;
  }
  
  revalidatePath("/admin/partners");
  return data;
}

export async function createPartner(_partner: any) {
  await requireAdmin();
  throw new Error("Create partners through Membership Requests after payment is marked paid and approved.");
}

export async function updatePartnerAuthPassword(partnerId: string, password: string) {
  await requireAdmin();

  const cleanPartnerId = String(partnerId || "").trim();
  const cleanPassword = String(password || "").trim();

  if (!cleanPartnerId) {
    return { success: false, error: "Partner ID is required." };
  }

  if (cleanPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const serviceClient = getSupabaseServiceClient();
  const { data: partner, error: partnerError } = await serviceClient
    .from("partners" as any)
    .select("id")
    .eq("id", cleanPartnerId)
    .maybeSingle();

  if (partnerError) {
    console.error("Error verifying partner before password reset:", partnerError);
    return { success: false, error: "Could not verify partner before reset." };
  }

  if (!partner) {
    return { success: false, error: "Partner record was not found." };
  }

  const { error } = await serviceClient.auth.admin.updateUserById(cleanPartnerId, {
    password: cleanPassword,
  });

  if (error) {
    console.error("Error updating partner auth password:", error);
    return { success: false, error: error.message || "Failed to update partner password." };
  }

  await serviceClient.from("partners" as any).update({ panel_password: cleanPassword }).eq("id", cleanPartnerId);

  await serviceClient.from("activity_logs" as any).insert({
    actor_id: null,
    actor_role: "admin",
    action: "partner_password_reset",
    entity_type: "partner",
    entity_id: cleanPartnerId,
    old_value: null,
    new_value: { note: "Password reset by admin" },
  });

  revalidatePath("/admin/memberships");
  revalidatePath("/admin/partners");
  return { success: true, message: "Partner password updated successfully." };
}

export async function adminLoginAsPartner(partnerId: string) {
  await requireAdmin();

  const cleanId = String(partnerId || "").trim();
  if (!cleanId) return { error: "Partner ID is required." };

  const serviceClient = getSupabaseServiceClient();

  const { data: profile } = await serviceClient
    .from("profiles" as any)
    .select("email")
    .eq("id", cleanId)
    .maybeSingle();
  if (!(profile as any)?.email) return { error: "Partner email not found." };

  const email = (profile as any).email as string;

  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.kiaskincare.com"}/partner/dashboard` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return { error: linkError?.message || "Failed to generate login link." };
  }

  await serviceClient.from("activity_logs" as any).insert({
    actor_id: null,
    actor_role: "admin",
    action: "admin_impersonation",
    entity_type: "partner",
    entity_id: cleanId,
    old_value: null,
    new_value: { email, note: "Admin logged in as partner" },
  });

  return { url: linkData.properties.action_link };
}

export async function generateTempPassword(partnerId: string) {
  await requireAdmin();

  const cleanId = String(partnerId || "").trim();
  if (!cleanId) return { error: "Partner ID is required." };

  const serviceClient = getSupabaseServiceClient();

  const { data: profile } = await serviceClient
    .from("profiles" as any)
    .select("email, full_name")
    .eq("id", cleanId)
    .maybeSingle();
  if (!(profile as any)?.email) return { error: "Partner not found." };

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let tempPw = "Kia@";
  for (let i = 0; i < 8; i++) tempPw += chars[Math.floor(Math.random() * chars.length)];

  const { error } = await serviceClient.auth.admin.updateUserById(cleanId, { password: tempPw });
  if (error) return { error: error.message || "Failed to set temporary password." };

  await serviceClient.from("partners" as any).update({ panel_password: tempPw }).eq("id", cleanId);

  await serviceClient.from("activity_logs" as any).insert({
    actor_id: null,
    actor_role: "admin",
    action: "temp_password_generated",
    entity_type: "partner",
    entity_id: cleanId,
    old_value: null,
    new_value: { email: (profile as any).email, note: "Temporary password generated by admin" },
  });

  return {
    tempPassword: tempPw,
    email: (profile as any).email,
    name: (profile as any).full_name,
  };
}
