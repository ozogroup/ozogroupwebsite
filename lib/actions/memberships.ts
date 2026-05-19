"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// MEMBERSHIP REQUESTS ACTIONS
// =====================================================

export async function getMembershipRequests() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("memberships" as any)
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
    .from("memberships" as any)
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
    .from("memberships" as any)
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

export async function createMembership(data: {
  full_name: string;
  mobile: string;
  email: string;
  city: string;
  address?: string;
  pin_code?: string;
  referral_code?: string;
  notes?: string;
}) {
  const supabase = getSupabaseServerClient();

  const { data: record, error } = await supabase
    .from("memberships" as any)
    .insert({
      full_name: data.full_name,
      mobile: data.mobile,
      email: data.email,
      city: data.city,
      address: data.address || null,
      pin_code: data.pin_code || null,
      referral_code: data.referral_code || null,
      notes: data.notes || null,
      membership_status: "pending",
      payment_status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating membership:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/memberships");
  return { data: record };
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("memberships" as any)
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

