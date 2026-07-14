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

  revalidatePath("/admin/memberships");
  revalidatePath("/admin/partners");
  return { success: true, message: "Partner password updated successfully." };
}
