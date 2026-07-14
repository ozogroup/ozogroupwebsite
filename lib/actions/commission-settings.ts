"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function getCommissionSettings() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("commission_settings")
    .select("*")
    .eq("active", true)
    .single();

  if (error) {
    console.error("Error fetching commission settings:", error);
    return null;
  }

  return data;
}

export async function updateCommissionSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const level_1_percentage = parseFloat(formData.get("level_1_percentage") as string);
  const level_2_percentage = parseFloat(formData.get("level_2_percentage") as string);
  const level_3_percentage = parseFloat(formData.get("level_3_percentage") as string);
  const level_4_percentage = parseFloat(formData.get("level_4_percentage") as string);

  // Validate percentages
  if (
    isNaN(level_1_percentage) ||
    isNaN(level_2_percentage) ||
    isNaN(level_3_percentage) ||
    isNaN(level_4_percentage)
  ) {
    return { error: "Invalid percentage values" };
  }

  // Get current active settings
  const { data: currentSettings } = await supabase
    .from("commission_settings")
    .select("*")
    .eq("active", true)
    .single();

  if (currentSettings) {
    // Deactivate current settings
    await supabase
      .from("commission_settings")
      .update({ active: false })
      .eq("id", currentSettings.id);
  }

  // Insert new settings
  const { data, error } = await supabase
    .from("commission_settings")
    .insert({
      level_1_percentage,
      level_2_percentage,
      level_3_percentage,
      level_4_percentage,
      active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating commission settings:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/referrals");
  
  return { data };
}
