import { getSupabaseServerClient } from "@/lib/supabase/server";
import { testimonials as staticTestimonials, faqs as staticFaqs, site as staticSite, referralLevels as staticReferralLevels, salesBonuses as staticSalesBonuses } from "@/lib/site";
import {
  treatmentEditorialImages,
  treatmentKitCatalog,
  treatmentKitSlugs,
} from "@/lib/treatments/catalog";

// ============================================================================
// PUBLIC DATA FETCHING WITH FALLBACK
// ============================================================================

export const defaultTreatmentCatalog = treatmentKitCatalog.map((treatment) => ({
  ...treatment,
  kitName: treatment.kitName,
  treatmentType: treatment.treatmentType,
}));

const legacyTreatmentImages = new Set([
  "/images/treatments/editorial/advanced-skin-care-treatment.png",
  "/images/treatments/editorial/japanese-skin-care-treatment.png",
  "/images/treatments/editorial/korean-glass-treatment.png",
  "/images/treatments/editorial/skin-lightening-treatment.png",
  "/images/treatments/editorial/basic-skin-care-treatment.png",
  "/images/client-approved/japanese-skin-care-kit.jpeg",
  "/images/client-approved/korean-glass-treatment-kit.jpeg",
  "/images/client-approved/skin-lightening-kit.jpeg",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80",
]);

function resolveTreatmentImages(slug: string, images: string[]) {
  const customImages = images.filter((image) => !legacyTreatmentImages.has(image));
  if (customImages.length > 0) return customImages;

  const editorialImage = treatmentEditorialImages[slug];
  return editorialImage ? [editorialImage] : images;
}

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

function normalizeImageList(value: unknown, fallback?: string | null) {
  let images: string[] = [];
  if (Array.isArray(value)) {
    images = value.filter((item): item is string => typeof item === "string");
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      images = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      images = value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  const cleanFallback = fallback?.trim();
  if (cleanFallback && !images.includes(cleanFallback)) images.unshift(cleanFallback);
  return Array.from(new Set(images.filter(Boolean)));
}

function normalizeList<T = string>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // Existing admin data may be stored as newline or comma-separated text.
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean) as T[];
}

/**
 * Fetch treatments from Supabase with fallback to the requested kit catalog.
 */
export async function getPublicTreatments() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("treatments" as any)
      .select("*")
      .eq("active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.log("Using default kit treatment data (fallback)");
      return defaultTreatmentCatalog;
    }

    const sorted = [...data].sort(
      (a: any, b: any) => ((treatmentKitSlugs.indexOf(a.slug) + 1) || 999) - ((treatmentKitSlugs.indexOf(b.slug) + 1) || 999)
    );

    // Transform Supabase data to match Treatment type.
    return sorted.map((t: any) => {
      const gallery = resolveTreatmentImages(
        t.slug,
        normalizeImageList(t.gallery, t.image || t.image_url)
      );

      return {
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
      benefits: normalizeList<string>(t.benefits),
      process: normalizeList<{ step: string; detail: string }>(t.process || t.process_steps),
      whoFor: normalizeList<string>(t.who_for),
      safety: t.safety || "",
      faqs: normalizeList<{ q: string; a: string }>(t.faqs),
      duration: t.duration || "",
      sessions: t.sessions || "",
      badge: t.badge || t.kit_name || "",
      icon: t.icon,
      tone: t.tone,
      image: gallery[0] || treatmentEditorialImages[t.slug],
      gallery,
      beforeImage: t.before_image_url || null,
      afterImage: t.after_image_url || null,
      imageAlt: t.image_alt || t.title,
      treatmentType: t.treatment_type || (t.type === "home_kit" ? "home-kit" : "camp"),
      note: t.cta_text || (t.kit_name ? `Includes ${t.kit_name}.` : ""),
      featured: t.featured || false,
      };
    });
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
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
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
        email: content.email || staticSite.email,
        address: replaceLegacyBranding(content.address || staticSite.address),
        businessHours: content.business_hours || staticSite.businessHours,
        weeklyOff: content.weekly_off || staticSite.weeklyOff,
        footerText: replaceLegacyBranding(content.footer_text),
        instagram: content.instagram || staticSite.instagram,
        facebook: content.facebook || staticSite.facebook,
      };
    }

    const phone = content.phone || (data as any).phone || staticSite.phone;
    const whatsapp = normalizeWhatsapp(
      content.whatsapp ||
        (data as any).whatsapp ||
        (data as any).whatsapp_url ||
        (data as any).whatsapp_number ||
        staticSite.whatsapp
    );

    return {
      phone,
      phoneRaw: phone.replace(/\s/g, ""),
      whatsapp,
      email: content.email || (data as any).email || staticSite.email,
      address: replaceLegacyBranding(content.address || (data as any).address || staticSite.address),
      businessHours: content.business_hours || (data as any).business_hours || staticSite.businessHours,
      weeklyOff: content.weekly_off || (data as any).weekly_off || staticSite.weeklyOff,
      footerText: replaceLegacyBranding(content.footer_text),
      instagram: content.instagram || (data as any).instagram_url || staticSite.instagram,
      facebook: content.facebook || (data as any).facebook_url || staticSite.facebook,
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
    const supabase = await getSupabaseServerClient();
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
    const supabase = await getSupabaseServerClient();
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
