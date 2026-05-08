"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// MEMBERSHIP REQUESTS ACTIONS
// =====================================================

export async function getMembershipRequests() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("membership_requests" as any)
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching membership requests:", error);
    return [];
  }
  
  return data || [];
}

export async function getMembershipById(id: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("membership_requests" as any)
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching membership request:", error);
    return null;
  }
  
  return data;
}

export async function updateMembershipStatus(id: string, status: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("membership_requests" as any)
    .update({ 
      membership_status: status, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating membership status:", error);
    throw error;
  }
  
  revalidatePath("/admin/memberships");
  return data;
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("membership_requests" as any)
    .update({ 
      payment_status: paymentStatus, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
  
  revalidatePath("/admin/memberships");
  return data;
}

export async function generateReferralCode(id: string, referralCode: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("membership_requests" as any)
    .update({ 
      generated_referral_code: referralCode, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error generating referral code:", error);
    throw error;
  }
  
  revalidatePath("/admin/memberships");
  return data;
}
