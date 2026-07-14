"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// =====================================================
// TESTIMONIALS ACTIONS
// =====================================================

export async function getTestimonials() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("testimonials" as any)
    .select("*")
    .order("display_order", { ascending: true });
  
  if (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }
  
  return data || [];
}

export async function getTestimonialById(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("testimonials" as any)
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching testimonial:", error);
    return null;
  }
  
  return data;
}

export async function createTestimonial(testimonial: any) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("testimonials" as any)
    .insert({
      ...testimonial,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating testimonial:", error);
    throw error;
  }
  
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return data;
}

export async function updateTestimonial(id: string, testimonial: any) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("testimonials" as any)
    .update({
      ...testimonial,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating testimonial:", error);
    throw error;
  }
  
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return data;
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { error } = await supabase
    .from("testimonials" as any)
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting testimonial:", error);
    throw error;
  }
  
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { success: true };
}

export async function toggleTestimonialActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("testimonials" as any)
    .update({ 
      is_active: isActive, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error toggling testimonial active:", error);
    throw error;
  }
  
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return data;
}
