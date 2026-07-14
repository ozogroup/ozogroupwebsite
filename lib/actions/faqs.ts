"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// =====================================================
// FAQs ACTIONS
// =====================================================

export async function getFaqs() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("faqs" as any)
    .select("*")
    .order("display_order", { ascending: true });
  
  if (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
  
  return data || [];
}

export async function getFaqById(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("faqs" as any)
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching FAQ:", error);
    return null;
  }
  
  return data;
}

export async function createFaq(faq: any) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("faqs" as any)
    .insert({
      ...faq,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating FAQ:", error);
    throw error;
  }
  
  revalidatePath("/admin/faqs");
  revalidatePath("/");
  return data;
}

export async function updateFaq(id: string, faq: any) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("faqs" as any)
    .update({
      ...faq,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating FAQ:", error);
    throw error;
  }
  
  revalidatePath("/admin/faqs");
  revalidatePath("/");
  return data;
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { error } = await supabase
    .from("faqs" as any)
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting FAQ:", error);
    throw error;
  }
  
  revalidatePath("/admin/faqs");
  revalidatePath("/");
  return { success: true };
}

export async function toggleFaqActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("faqs" as any)
    .update({ 
      is_active: isActive, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error toggling FAQ active:", error);
    throw error;
  }
  
  revalidatePath("/admin/faqs");
  revalidatePath("/");
  return data;
}
