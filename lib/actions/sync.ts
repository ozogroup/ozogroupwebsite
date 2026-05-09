"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { treatments as siteTreatments, testimonials as siteTestimonials, faqs as siteFaqs, site } from "@/lib/site";

/**
 * Sync hardcoded website data into Supabase.
 * - Inserts treatments (skips existing slugs)
 * - Inserts testimonials (skips existing names+message combos)
 * - Inserts FAQs (skips existing questions)
 * - Inserts contact_settings (only if no row exists)
 */
export async function syncWebsiteData() {
  const supabase = getSupabaseServerClient();
  const result = { treatments: 0, testimonials: 0, faqs: 0, contact: 0, errors: [] as string[] };

  // ==========================
  // TREATMENTS
  // ==========================
  try {
    const { data: existingTreatments } = await supabase
      .from("treatments" as any)
      .select("slug");

    const existingSlugs = new Set((existingTreatments as any[] | null)?.map((t) => t.slug) || []);

    const toInsert = siteTreatments
      .filter((t) => !existingSlugs.has(t.slug))
      .map((t) => ({
        title: t.title,
        slug: t.slug,
        type: t.treatmentType === "home-kit" ? "home_kit" : t.treatmentType === "camp" ? "campaign" : "clinic",
        price: t.price,
        tagline: t.tagline || t.subtitle || "",
        description: t.description || t.overview || "",
        benefits: t.benefits || [],
        duration: t.duration || "",
        sessions: t.sessions || "",
        image: t.image || "",
        active: true,
        requires_slots: t.treatmentType === "camp",
        available_cities: [],
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("treatments" as any).insert(toInsert as any);
      if (error) {
        result.errors.push(`Treatments: ${error.message}`);
      } else {
        result.treatments = toInsert.length;
      }
    }
  } catch (e: any) {
    result.errors.push(`Treatments: ${e.message}`);
  }

  // ==========================
  // TESTIMONIALS
  // ==========================
  try {
    const { data: existingTestimonials } = await supabase
      .from("testimonials" as any)
      .select("name, message");

    const existingKeys = new Set(
      (existingTestimonials as any[] | null)?.map((t) => `${t.name}|${t.message}`) || []
    );

    const toInsert = siteTestimonials
      .filter((t) => !existingKeys.has(`${t.name}|${t.quote}`))
      .map((t, idx) => ({
        name: t.name,
        role: t.city ? `${t.treatment} · ${t.city}` : t.treatment || "",
        message: t.quote,
        rating: t.rating || 5,
        image: "",
        is_active: true,
        display_order: idx,
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("testimonials" as any).insert(toInsert as any);
      if (error) {
        result.errors.push(`Testimonials: ${error.message}`);
      } else {
        result.testimonials = toInsert.length;
      }
    }
  } catch (e: any) {
    result.errors.push(`Testimonials: ${e.message}`);
  }

  // ==========================
  // FAQs
  // ==========================
  try {
    const { data: existingFaqs } = await supabase
      .from("faqs" as any)
      .select("question");

    const existingQs = new Set((existingFaqs as any[] | null)?.map((f) => f.question) || []);

    const toInsert = siteFaqs
      .filter((f) => !existingQs.has(f.q))
      .map((f, idx) => ({
        question: f.q,
        answer: f.a,
        category: "general",
        display_order: idx,
        is_active: true,
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("faqs" as any).insert(toInsert as any);
      if (error) {
        result.errors.push(`FAQs: ${error.message}`);
      } else {
        result.faqs = toInsert.length;
      }
    }
  } catch (e: any) {
    result.errors.push(`FAQs: ${e.message}`);
  }

  // ==========================
  // CONTACT SETTINGS
  // ==========================
  try {
    const { data: existingContact } = await supabase
      .from("contact_settings" as any)
      .select("id")
      .limit(1);

    if (!existingContact || existingContact.length === 0) {
      const { error } = await supabase.from("contact_settings" as any).insert({
        phone: site.phone,
        whatsapp: site.phone,
        email: "",
        address: "",
        business_hours: "Mon - Sat: 10:00 AM - 7:00 PM",
        instagram_url: site.instagram,
        facebook_url: "",
        twitter_url: "",
        linkedin_url: "",
        youtube_url: "",
      } as any);

      if (error) {
        result.errors.push(`Contact: ${error.message}`);
      } else {
        result.contact = 1;
      }
    }
  } catch (e: any) {
    result.errors.push(`Contact: ${e.message}`);
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/treatments");
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin/faqs");
  revalidatePath("/admin/contact");

  return result;
}
