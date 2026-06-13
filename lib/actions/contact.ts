"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// CONTACT SETTINGS ACTIONS
// =====================================================

export async function getContactSettings() {
  const supabase = await getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("contact_settings" as any)
    .select("*")
    .single();
  
  if (error) {
    console.error("Error fetching contact settings:", error);
    return null;
  }
  
  return data;
}

export async function updateContactSettings(settings: any) {
  const supabase = await getSupabaseServerClient();
  
  // Check if settings exist
  const { data: existing } = await supabase
    .from("contact_settings" as any)
    .select("id")
    .limit(1)
    .single();
  
  let result;
  
  if (existing && (existing as any).id) {
    // Update existing
    result = await supabase
      .from("contact_settings" as any)
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq("id", (existing as any).id)
      .select()
      .single();
  } else {
    // Insert new
    result = await supabase
      .from("contact_settings" as any)
      .insert({
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
  }
  
  if (result.error) {
    console.error("Error updating contact settings:", result.error);
    throw result.error;
  }
  
  revalidatePath("/admin/contact");
  return result.data;
}
