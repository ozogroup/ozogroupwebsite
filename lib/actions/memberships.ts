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
  address: string;
  pin_code: string;
  referral_code?: string;
  notes?: string;
}) {
  // Validation
  if (!data.full_name?.trim()) return { error: "Full name is required" };
  if (!data.mobile?.trim()) return { error: "Mobile number is required" };
  if (!data.email?.trim()) return { error: "Email is required" };
  if (!data.city?.trim()) return { error: "City is required" };
  if (!data.address?.trim()) return { error: "Address is required" };
  if (!data.pin_code?.trim()) return { error: "Pin code is required" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return { error: "Invalid email format" };

  const mobileRegex = /^\+?[\d\s\-()]{7,15}$/;
  if (!mobileRegex.test(data.mobile)) return { error: "Invalid mobile number" };

  const supabase = getSupabaseServerClient();

  const { data: record, error } = await supabase
    .from("memberships" as any)
    .insert({
      full_name: data.full_name.trim(),
      mobile: data.mobile.trim(),
      email: data.email.trim(),
      city: data.city.trim(),
      address: data.address.trim(),
      pin_code: data.pin_code.trim(),
      amount: 1199,
      referral_code: data.referral_code?.trim() || null,
      notes: data.notes?.trim() || null,
      membership_status: "pending_payment",
      payment_status: "pending_payment",
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

