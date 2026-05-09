"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSystemSettings() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching system settings:", error);
    return null;
  }

  return data;
}

export async function updateSystemSettings(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const maintenance_mode = formData.get("maintenance_mode") === "true";
  const payouts_enabled = formData.get("payouts_enabled") === "true";
  const commissions_enabled = formData.get("commissions_enabled") === "true";
  const bookings_enabled = formData.get("bookings_enabled") === "true";
  const membership_enabled = formData.get("membership_enabled") === "true";

  const { data, error } = await supabase
    .from("system_settings")
    .update({
      maintenance_mode,
      payouts_enabled,
      commissions_enabled,
      bookings_enabled,
      membership_enabled,
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating system settings:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  
  return { data };
}
