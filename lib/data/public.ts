import { getSupabaseServerClient } from "@/lib/supabase/server";
import { testimonials as staticTestimonials, faqs as staticFaqs, site as staticSite, referralLevels as staticReferralLevels, salesBonuses as staticSalesBonuses } from "@/lib/site";

// ============================================================================
// PUBLIC DATA FETCHING WITH FALLBACK
// ============================================================================

export const defaultTreatmentCatalog = [
  {
    slug: "advance-kit",
    title: "Advance Kit",
    kitName: "Advance Kit",
    price: 18000,
    priceLabel: "₹18,000",
    unit: "complete kit",
    tagline: "Advanced Home Kit",
    subtitle: "Advanced Home Kit",
    description: "A premium advanced skincare kit designed for guided home-care transformation.",
    overview: "A complete advanced home-care kit with premium clinical-grade products and support.",
    benefits: ["Advanced skin repair", "Pigmentation support", "Premium guided home care", "Visible radiance"],
    process: [],
    whoFor: ["Advanced home-care clients", "Pigmentation and repair focused users"],
    safety: "Doctor-guided and patch-tested for responsible home use.",
    faqs: [],
    duration: "4-6 weeks",
    sessions: "Complete kit program",
    badge: "Premium Kit",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Advance skincare kit",
    treatmentType: "home-kit",
    note: "Includes premium home-care kit delivery.",
    featured: true,
  },
  {
    slug: "japanese-kit",
    title: "Japanese Kit",
    kitName: "Japanese Kit",
    price: 22000,
    priceLabel: "₹22,000",
    unit: "complete kit",
    tagline: "Japanese Ritual Kit",
    subtitle: "Japanese Ritual Kit",
    description: "A refined Japanese-inspired skincare kit for calm, clear, porcelain-like radiance.",
    overview: "A luxury home-care kit inspired by Japanese skincare rituals and gentle refinement.",
    benefits: ["Texture refinement", "Calm clear skin", "Balanced glow", "Gentle home ritual"],
    process: [],
    whoFor: ["Sensitive skin", "Texture refinement", "Refined glow seekers"],
    safety: "Gentle, guided, and suitable for premium home-care routines.",
    faqs: [],
    duration: "4-6 weeks",
    sessions: "Complete kit program",
    badge: "Japanese Care",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Japanese skincare kit",
    treatmentType: "home-kit",
    note: "Includes Japanese-inspired skincare kit.",
    featured: false,
  },
  {
    slug: "korean-glass-kit",
    title: "Korean Glass Kit",
    kitName: "Korean Glass Kit",
    price: 15000,
    priceLabel: "₹15,000",
    unit: "complete kit",
    tagline: "Glass Glow Home Kit",
    subtitle: "Glass Glow Home Kit",
    description: "A Korean glass-skin inspired home kit for hydrated, luminous, dewy skin.",
    overview: "A complete Korean-inspired home-care kit for dewy hydration and everyday radiance.",
    benefits: ["Glass-skin glow", "Hydration support", "Dewy finish", "K-beauty inspired care"],
    process: [],
    whoFor: ["Dull skin", "Hydration seekers", "K-beauty glow lovers"],
    safety: "Patch-tested, guided home care for visible glow.",
    faqs: [],
    duration: "4-6 weeks",
    sessions: "Complete kit program",
    badge: "Glass Kit",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Korean glass skincare kit",
    treatmentType: "home-kit",
    note: "Includes Korean glass glow kit.",
    featured: true,
  },
  {
    slug: "basic-kit",
    title: "Basic Kit",
    kitName: "Basic Kit",
    price: 14000,
    priceLabel: "₹14,000",
    unit: "complete kit",
    tagline: "Essential Skin Kit",
    subtitle: "Essential Skin Kit",
    description: "An essential skincare kit for foundational cleansing, hydration, and glow maintenance.",
    overview: "A premium starter kit for healthy skin routines and visible daily freshness.",
    benefits: ["Beginner friendly", "Glow maintenance", "Hydration and cleansing", "All-skin support"],
    process: [],
    whoFor: ["First-time skincare clients", "Maintenance care", "All skin types"],
    safety: "Gentle, simple, and designed for guided everyday use.",
    faqs: [],
    duration: "4-6 weeks",
    sessions: "Complete kit program",
    badge: "Essential",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Basic skincare kit",
    treatmentType: "home-kit",
    note: "Includes essential skincare kit.",
    featured: false,
  },
  {
    slug: "korean-glass-treatment",
    title: "Korean Glass Treatment",
    kitName: "Korean Glass Treatment",
    price: 25000,
    priceLabel: "₹25,000",
    unit: "per session",
    tagline: "Premium Clinical Glow Experience",
    subtitle: "Premium Clinical Glow Experience",
    description: "A premium Korean glass-skin clinical treatment for luminous, dewy, event-ready radiance.",
    overview: "A doctor-supervised premium protocol focused on hydration, refinement, and the signature glass-skin finish.",
    benefits: ["Deep hydration glow", "Glass skin finish", "Skin texture refinement", "Premium clinical care"],
    process: [],
    whoFor: ["Pre-event glow seekers", "Dry or dull skin", "Premium clinical care clients"],
    safety: "Doctor-supervised and delivered in premium clinical settings.",
    faqs: [],
    duration: "75-90 min",
    sessions: "Event-based sessions",
    badge: "Premium",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Korean Glass Treatment",
    treatmentType: "camp",
    note: "Clinic and campaign-based premium experience.",
    featured: true,
  },
];

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
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.log("Using default kit treatment data (fallback)");
      return defaultTreatmentCatalog;
    }

    // Transform Supabase data to match Treatment type
    return data.map((t: any) => ({
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
          "Advanced Skin Treatments",
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
