"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// PAYOUTS ACTIONS
// =====================================================

export async function getPayouts() {
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

export async function updatePayoutStatus(id: string, status: string, transactionId?: string) {
  const supabase = getSupabaseServerClient();
  
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (transactionId) {
    updateData.transaction_id = transactionId;
  }
  
  if (status === "paid") {
    updateData.paid_date = new Date().toISOString();
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
