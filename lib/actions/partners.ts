"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// PARTNERS ACTIONS
// =====================================================

export async function getPartners() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("partners" as any)
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching partners:", error);
    return [];
  }
  
  return data || [];
}

export async function getPartnerById(id: string) {
  const supabase = getSupabaseServerClient();
  
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
  const supabase = getSupabaseServerClient();
  
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

export async function createPartner(partner: any) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("partners" as any)
    .insert({
      ...partner,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating partner:", error);
    throw error;
  }
  
  revalidatePath("/admin/partners");
  return data;
}
