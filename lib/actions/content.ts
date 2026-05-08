"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// SITE CONTENT ACTIONS
// =====================================================

export async function getSiteContent(section?: string) {
  const supabase = getSupabaseServerClient();
  
  let query = supabase.from("site_content" as any).select("*").order("display_order", { ascending: true });
  
  if (section) {
    query = query.eq("section", section);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching site content:", error);
    return [];
  }
  
  return data || [];
}

export async function updateSiteContent(id: string, value: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("site_content" as any)
    .update({ value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating site content:", error);
    throw error;
  }
  
  revalidatePath("/admin/content");
  return data;
}

export async function updateSiteContentBulk(updates: { id: string; value: string }[]) {
  const supabase = getSupabaseServerClient();
  
  for (const update of updates) {
    const { error } = await supabase
      .from("site_content" as any)
      .update({ value: update.value, updated_at: new Date().toISOString() })
      .eq("id", update.id);
    
    if (error) {
      console.error("Error updating site content:", error);
      throw error;
    }
  }
  
  revalidatePath("/admin/content");
  return { success: true };
}
