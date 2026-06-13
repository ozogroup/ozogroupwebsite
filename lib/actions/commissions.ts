"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// COMMISSIONS ACTIONS
// =====================================================

export async function getCommissions() {
  const supabase = await getSupabaseServerClient();
  
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
  
  return data || [];
}

export async function updateCommissionStatus(id: string, status: string) {
  const supabase = await getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("commissions" as any)
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating commission status:", error);
    throw error;
  }
  
  revalidatePath("/admin/commissions");
  return data;
}
