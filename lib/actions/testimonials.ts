"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// TESTIMONIALS ACTIONS
// =====================================================

export async function getTestimonials() {
  const supabase = getSupabaseServerClient();
  
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
  const supabase = getSupabaseServerClient();
  
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
  const supabase = getSupabaseServerClient();
  
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
  return data;
}

export async function updateTestimonial(id: string, testimonial: any) {
  const supabase = getSupabaseServerClient();
  
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
  return data;
}

export async function deleteTestimonial(id: string) {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from("testimonials" as any)
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting testimonial:", error);
    throw error;
  }
  
  revalidatePath("/admin/testimonials");
  return { success: true };
}

export async function toggleTestimonialActive(id: string, isActive: boolean) {
  const supabase = getSupabaseServerClient();
  
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
  return data;
}
