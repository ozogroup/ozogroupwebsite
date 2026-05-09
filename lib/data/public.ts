import { getSupabaseServerClient } from "@/lib/supabase/server";
import { treatments as staticTreatments, testimonials as staticTestimonials, faqs as staticFaqs, site as staticSite } from "@/lib/site";

// ============================================================================
// PUBLIC DATA FETCHING WITH FALLBACK
// ============================================================================

/**
 * Fetch treatments from Supabase with fallback to static data
 */
export async function getPublicTreatments() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("treatments" as any)
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.log("Using static treatments data (fallback)");
      return staticTreatments;
    }

    // Transform Supabase data to match Treatment type
    return data.map((t: any) => ({
      slug: t.slug,
      title: t.title,
      price: t.price,
      priceLabel: t.price_label,
      unit: t.unit,
      tagline: t.tagline,
      subtitle: t.subtitle,
      description: t.description,
      overview: t.overview,
      benefits: t.benefits || [],
      process: t.process || [],
      whoFor: t.who_for || [],
      safety: t.safety,
      faqs: t.faqs || [],
      duration: t.duration,
      sessions: t.sessions,
      badge: t.badge,
      icon: t.icon,
      tone: t.tone,
      image: t.image,
      imageAlt: t.image_alt,
      treatmentType: t.treatment_type,
      note: t.cta_text,
    }));
  } catch (error) {
    console.error("Error fetching treatments from Supabase:", error);
    return staticTreatments;
  }
}

/**
 * Fetch testimonials from Supabase with fallback to static data
 */
export async function getPublicTestimonials() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("testimonials" as any)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.log("Using static testimonials data (fallback)");
      return staticTestimonials;
    }

    return data.map((t: any) => ({
      name: t.name,
      city: t.city,
      treatment: t.treatment,
      quote: t.quote,
      rating: t.rating,
    }));
  } catch (error) {
    console.error("Error fetching testimonials from Supabase:", error);
    return staticTestimonials;
  }
}

/**
 * Fetch FAQs from Supabase with fallback to static data
 */
export async function getPublicFaqs() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("faqs" as any)
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      console.log("Using static FAQs data (fallback)");
      return staticFaqs;
    }

    return data.map((f: any) => ({
      q: f.question,
      a: f.answer,
    }));
  } catch (error) {
    console.error("Error fetching FAQs from Supabase:", error);
    return staticFaqs;
  }
}

/**
 * Fetch site content from Supabase
 */
export async function getPublicSiteContent(section?: string) {
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("site_content" as any)
      .select("*")
      .order("display_order", { ascending: true });

    if (section) {
      query = query.eq("section", section);
    }

    const { data, error } = await query;

    if (error || !data) {
      return {};
    }

    // Convert to key-value object
    const content: Record<string, string> = {};
    data.forEach((item: any) => {
      content[item.key_name] = item.value;
    });

    return content;
  } catch (error) {
    console.error("Error fetching site content from Supabase:", error);
    return {};
  }
}

/**
 * Fetch contact settings from Supabase with fallback to static data
 */
export async function getPublicContactSettings() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("contact_settings" as any)
      .select("*")
      .single();

    if (error || !data) {
      console.log("Using static contact data (fallback)");
      return staticSite;
    }

    return {
      phone: (data as any).phone,
      phoneRaw: ((data as any).phone || "").replace(/\s/g, ""),
      whatsapp: (data as any).whatsapp,
      instagram: (data as any).instagram_url,
    };
  } catch (error) {
    console.error("Error fetching contact settings from Supabase:", error);
    return staticSite;
  }
}
