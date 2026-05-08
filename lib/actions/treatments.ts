"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getTreatments() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching treatments:", error);
    return [];
  }

  return data;
}

export async function getTreatmentById(id: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching treatment:", error);
    return null;
  }

  return data;
}

export async function createTreatment(formData: FormData) {
  "use server";

  const supabase = getSupabaseServerClient();

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const type = formData.get("type") as string;
  const price = formData.get("price") as string;
  const tagline = formData.get("tagline") as string;
  const description = formData.get("description") as string;
  const benefits = formData.get("benefits") as string;
  const duration = formData.get("duration") as string;
  const sessions = formData.get("sessions") as string;
  const image = formData.get("image") as string;
  const active = formData.get("active") === "true";
  const requiresSlots = formData.get("requires_slots") === "true";
  const availableCities = formData.get("available_cities") as string;

  const { data, error } = await supabase.from("treatments").insert({
    title,
    slug,
    type: type as "home_kit" | "clinic" | "campaign",
    price: parseFloat(price) || 0,
    tagline,
    description,
    benefits: benefits ? JSON.parse(benefits) : [],
    duration,
    sessions,
    image,
    active,
    requires_slots: requiresSlots,
    available_cities: availableCities ? JSON.parse(availableCities) : [],
  }).select().single();

  if (error) {
    console.error("Error creating treatment:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/treatments");
  return { data };
}

export async function updateTreatment(formData: FormData) {
  "use server";

  const supabase = getSupabaseServerClient();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const type = formData.get("type") as string;
  const price = formData.get("price") as string;
  const tagline = formData.get("tagline") as string;
  const description = formData.get("description") as string;
  const benefits = formData.get("benefits") as string;
  const duration = formData.get("duration") as string;
  const sessions = formData.get("sessions") as string;
  const image = formData.get("image") as string;
  const active = formData.get("active") === "true";
  const requiresSlots = formData.get("requires_slots") === "true";
  const availableCities = formData.get("available_cities") as string;

  const { data, error } = await supabase
    .from("treatments")
    .update({
      title,
      slug,
      type: type as "home_kit" | "clinic" | "campaign",
      price: parseFloat(price) || 0,
      tagline,
      description,
      benefits: benefits ? JSON.parse(benefits) : [],
      duration,
      sessions,
      image,
      active,
      requires_slots: requiresSlots,
      available_cities: availableCities ? JSON.parse(availableCities) : [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating treatment:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/treatments");
  return { data };
}

export async function deleteTreatment(id: string) {
  "use server";

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("treatments").delete().eq("id", id);

  if (error) {
    console.error("Error deleting treatment:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/treatments");
  return { success: true };
}

export async function toggleTreatmentActive(id: string, active: boolean) {
  "use server";

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("treatments")
    .update({ active })
    .eq("id", id);

  if (error) {
    console.error("Error toggling treatment active:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/treatments");
  return { success: true };
}
