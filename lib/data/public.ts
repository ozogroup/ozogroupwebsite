import { getSupabaseServerClient } from "@/lib/supabase/server";
import { testimonials as staticTestimonials, faqs as staticFaqs, site as staticSite, referralLevels as staticReferralLevels, salesBonuses as staticSalesBonuses } from "@/lib/site";
import { treatmentKitCatalog, treatmentKitSlugs } from "@/lib/treatments/catalog";

// ============================================================================
// PUBLIC DATA FETCHING WITH FALLBACK
// ============================================================================

export const defaultTreatmentCatalog = treatmentKitCatalog.map((treatment) => ({
  ...treatment,
  kitName: treatment.kitName,
  treatmentType: treatment.treatmentType,
}));

function normalizePublicTreatmentName(name?: string | null) {
  const value = (name || "").trim();
  const approved = new Set<string>(treatmentKitCatalog.map((treatment) => treatment.title));
  return approved.has(value) ? value : "Advance Kit";
}

function normalizeWhatsapp(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return staticSite.whatsapp;
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : staticSite.whatsapp;
}

function replaceLegacyBranding(value?: string | null) {
  return (value || "")
    .replace(/\bKKIA Skin Care\b/gi, "KIA Skin Care")
    .replace(/OZO\s*\/\s*IA Skin Care/gi, "KIA Skin Care")
    .replace(/OZO Skin Care/gi, "KIA Skin Care")
    .replace(/OZO Services?/gi, "KIA Skin Care")
    .replace(/OZO Group/gi, "KIA Skin Care")
    .replace(/\bIA Skin Care Division\b/gi, "KIA Skin Care")
    .replace(/\bIA Skin Care\b/gi, "KIA Skin Care")
    .replace(/\bOZO\b(?!\d)/gi, "KIA Skin Care");
}

/**
 * Fetch treatments from Supabase with fallback to the requested kit catalog.
 */
export async function getPublicTreatments() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("treatments" as any)
      .select("*")
      .eq("active", true)
      .is("deleted_at", null)
      .in("slug", treatmentKitSlugs as unknown as string[])
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.log("Using default kit treatment data (fallback)");
      return defaultTreatmentCatalog;
    }

    const sorted = [...data].sort(
      (a: any, b: any) => treatmentKitSlugs.indexOf(a.slug) - treatmentKitSlugs.indexOf(b.slug)
    );

    // Transform Supabase data to match Treatment type
    return sorted.map((t: any) => ({
      slug: t.slug,
      title: t.title,
      kitName: t.kit_name || t.title,
      price: t.price,
      priceLabel: t.price_label || `₹${Number(t.price || 0).toLocaleString("en-IN")}`,
      unit: t.unit || (t.type === "home_kit" ? "complete kit" : "per session"),
      tagline: t.tagline || t.kit_name || t.title,
      subtitle: t.subtitle || t.tagline || "",
      description: t.description || "",
      overview: t.overview || t.description || "",
      benefits: t.benefits || [],
      process: t.process || t.process_steps || [],
      whoFor: t.who_for || [],
      safety: t.safety || "",
      faqs: t.faqs || [],
      duration: t.duration || "",
      sessions: t.sessions || "",
      badge: t.badge || t.kit_name || "",
      icon: t.icon,
      tone: t.tone,
      image: t.image || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80",
      imageAlt: t.image_alt || t.title,
      treatmentType: t.treatment_type || (t.type === "home_kit" ? "home-kit" : "camp"),
      note: t.cta_text || (t.kit_name ? `Includes ${t.kit_name}.` : ""),
      featured: t.featured || false,
    }));
  } catch (error) {
    console.error("Error fetching treatments from Supabase:", error);
    return defaultTreatmentCatalog;
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
      treatment: normalizePublicTreatmentName(t.treatment),
      quote: replaceLegacyBranding(t.quote),
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
      q: replaceLegacyBranding(f.question),
      a: replaceLegacyBranding(f.answer),
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
      content[item.key_name] = replaceLegacyBranding(item.value);
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
    const [{ data, error }, { data: contentRows }] = await Promise.all([
      supabase.from("contact_settings" as any).select("*").single(),
      supabase
        .from("site_content" as any)
        .select("*")
        .in("section", ["contact", "footer"]),
    ]);

    const content: Record<string, string> = {};
    (contentRows || []).forEach((item: any) => {
      content[item.content_key || item.key_name] = item.value || "";
    });

    if (error || !data) {
      console.log("Using static contact data (fallback)");
      return {
        ...staticSite,
        phone: content.phone || staticSite.phone,
        phoneRaw: (content.phone || staticSite.phone).replace(/\s/g, ""),
        whatsapp: normalizeWhatsapp(content.whatsapp || staticSite.whatsapp),
        email: content.email || "",
        address: replaceLegacyBranding(content.address),
        footerText: replaceLegacyBranding(content.footer_text),
      };
    }

    const phone = content.phone || (data as any).phone || staticSite.phone;
    const whatsapp = normalizeWhatsapp(content.whatsapp || (data as any).whatsapp || staticSite.whatsapp);

    return {
      phone,
      phoneRaw: phone.replace(/\s/g, ""),
      whatsapp,
      email: content.email || (data as any).email || "",
      address: replaceLegacyBranding(content.address || (data as any).address),
      footerText: replaceLegacyBranding(content.footer_text),
      instagram: (data as any).instagram_url,
    };
  } catch (error) {
    console.error("Error fetching contact settings from Supabase:", error);
    return staticSite;
  }
}

/**
 * Fetch commission settings from Supabase with fallback to static data
 */
export async function getPublicCommissionSettings() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("commission_settings" as any)
      .select("*")
      .single();

    if (error || !data) {
      console.log("Using static commission data (fallback)");
      return {
        referralLevels: staticReferralLevels,
        salesBonuses: staticSalesBonuses,
      };
    }

    return {
      referralLevels: (data as any).referral_levels || staticReferralLevels,
      salesBonuses: (data as any).sales_bonuses || staticSalesBonuses,
    };
  } catch (error) {
    console.error("Error fetching commission settings from Supabase:", error);
    return {
      referralLevels: staticReferralLevels,
      salesBonuses: staticSalesBonuses,
    };
  }
}

/**
 * Fetch system settings from Supabase
 */
export async function getPublicSystemSettings() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("system_settings" as any)
      .select("*")
      .single();

    if (error || !data) {
      return {
        membershipPrice: "1199",
        membershipFeatures: [
          "Premium referral dashboard access",
          "Real-time earnings tracking",
          "Multi-level commission structure",
          "Milestone bonus rewards",
          "Transparent payout status",
        ],
        heroPoints: [
          "Premium Treatment Kits",
          "Doctor-Supervised Protocols",
          "Premium Clinical Care",
          "Visible Results",
        ],
      };
    }

    return {
      membershipPrice: (data as any).membership_price || "1199",
      membershipFeatures: (data as any).membership_features || [],
      heroPoints: (data as any).hero_points || [],
    };
  } catch (error) {
    console.error("Error fetching system settings from Supabase:", error);
    return {
      membershipPrice: "1199",
      membershipFeatures: [],
      heroPoints: [],
    };
  }
}
