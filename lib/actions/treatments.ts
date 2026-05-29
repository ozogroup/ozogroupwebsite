"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { treatmentKitCatalog, treatmentKitSlugs } from "@/lib/treatments/catalog";

export async function getTreatments() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatments" as any)
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
    .from("treatments" as any)
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
  const featured = formData.get("featured") !== null;
  const active = formData.get("active") !== null;
  const requiresSlots = formData.get("requires_slots") !== null;
  const availableCities = formData.get("available_cities") as string;

  const { data, error } = await supabase.from("treatments" as any).insert({
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
    featured,
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
  const featured = formData.get("featured") !== null;
  const active = formData.get("active") !== null;
  const requiresSlots = formData.get("requires_slots") !== null;
  const availableCities = formData.get("available_cities") as string;

  const { data, error } = await supabase
    .from("treatments" as any)
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
      featured,
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

  const { error } = await supabase.from("treatments" as any).delete().eq("id", id);

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
    .from("treatments" as any)
    .update({ active, is_active: active, deleted_at: active ? null : new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error toggling treatment active:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/treatments");
  return { success: true };
}

export async function ensureFinalTreatmentCatalog() {
  "use server";

  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const approvedSlugFilter = `(${treatmentKitSlugs.map((slug) => `"${slug}"`).join(",")})`;

  const { error: deactivateError } = await supabase
    .from("treatments" as any)
    .update({
      active: false,
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .not("slug", "in", approvedSlugFilter);

  if (deactivateError) {
    console.error("Error deactivating old treatments:", deactivateError);
    return { error: "Unable to prepare treatment catalog." };
  }

  const rows = treatmentKitCatalog.map((treatment) => ({
    slug: treatment.slug,
    title: treatment.title,
    type: treatment.type,
    price: treatment.price,
    price_label: treatment.priceLabel,
    unit: treatment.unit,
    tagline: treatment.tagline,
    subtitle: treatment.subtitle,
    description: treatment.description,
    overview: treatment.overview,
    benefits: treatment.benefits,
    process: treatment.process,
    process_steps: treatment.process,
    who_for: JSON.stringify(treatment.whoFor),
    safety: treatment.safety,
    faqs: treatment.faqs,
    duration: treatment.duration,
    sessions: treatment.sessions,
    badge: treatment.badge,
    icon: treatment.icon,
    tone: treatment.tone,
    image: treatment.image,
    image_alt: treatment.imageAlt,
    cta_text: treatment.note,
    active: true,
    is_active: true,
    featured: treatment.featured,
    requires_slots: treatment.requiresSlots,
    available_cities: treatment.availableCities,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("treatments" as any)
    .upsert(rows as any, { onConflict: "slug" });

  if (error) {
    console.error("Error seeding final treatments:", error);
    return { error: "Unable to sync final treatments. Please apply the treatment SQL migration first." };
  }

  revalidatePath("/");
  revalidatePath("/treatments");
  revalidatePath("/admin/treatments");
  revalidatePath("/admin/dashboard");
  return { success: true, count: rows.length };
}
