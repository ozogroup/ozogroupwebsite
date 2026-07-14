"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// =====================================================
// CONTACT SETTINGS ACTIONS
// =====================================================

export async function getContactSettings() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
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
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const clean = {
    phone: String(settings?.phone || "").trim(),
    whatsapp: String(settings?.whatsapp || "").trim(),
    email: String(settings?.email || "").trim().toLowerCase(),
    address: String(settings?.address || "").trim(),
    business_hours: String(settings?.business_hours || "").trim(),
    weekly_off: String(settings?.weekly_off || "").trim(),
    facebook_url: String(settings?.facebook_url || "").trim(),
    instagram_url: String(settings?.instagram_url || "").trim(),
    youtube_url: String(settings?.youtube_url || "").trim(),
  };

  if (!clean.phone) throw new Error("Phone number is required.");
  if (!clean.whatsapp) throw new Error("WhatsApp contact is required.");
  if (!clean.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    throw new Error("Please enter a valid contact email.");
  }
  if (!clean.address) throw new Error("Address is required.");

  function withoutMissingColumns(data: Record<string, string>, error: any) {
    const next = { ...data };
    const message = `${error?.message || ""} ${error?.details || ""}`;
    for (const column of Object.keys(next)) {
      if (new RegExp(`\\b${column}\\b`, "i").test(message)) {
        delete next[column];
      }
    }
    return next;
  }
  
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
        ...clean,
        updated_at: new Date().toISOString()
      })
      .eq("id", (existing as any).id)
      .select()
      .single();

    if (result.error && result.error.code === "PGRST204") {
      result = await supabase
        .from("contact_settings" as any)
        .update({
          ...withoutMissingColumns(clean, result.error),
          updated_at: new Date().toISOString()
        })
        .eq("id", (existing as any).id)
        .select()
        .single();
    }
  } else {
    // Insert new
    result = await supabase
      .from("contact_settings" as any)
      .insert({
        ...clean,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (result.error && result.error.code === "PGRST204") {
      result = await supabase
        .from("contact_settings" as any)
        .insert({
          ...withoutMissingColumns(clean, result.error),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }
  }
  
  if (result.error) {
    console.error("Error updating contact settings:", result.error);
    throw result.error;
  }
  
  revalidatePath("/admin/contact");
  revalidatePath("/contact");
  revalidatePath("/");
  return result.data;
}
