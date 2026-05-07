import type {
  Treatment,
  ReferralLevel,
  SalesBonus,
  Testimonial,
  FAQItem,
  TrustBadge,
} from "@/types";

export const site = {
  parent: "OZO GROUP",
  brand: "IA SKIN CARE",
  division: "IA Skin Care Division",
  tagline: "Glow Better. Earn Smarter.",
  phone: "+91 76986 17054",
  phoneRaw: "+917698617054",
  whatsapp:
    "https://wa.me/917698617054?text=Hello%20IA%20Skin%20Care%2C%20I%20want%20to%20book%20a%20skincare%20consultation.",
  instagram:
    "https://www.instagram.com/ia_korean_gloh_tretment?igsh=bmZqOHc0bnU5OW95",
  membershipFee: 1199,
  developer: {
    name: "The Gujarati Designer",
    url: "https://www.thegujaratidesigner.in",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Treatments", href: "/treatments" },
    { label: "About", href: "/about" },
    { label: "Membership", href: "/referral" },
    { label: "Contact", href: "/contact" },
  ],
};

export const trustBadges: TrustBadge[] = [
  {
    label: "Doctor Supervised",
    description: "Expert-led protocols",
    icon: "doctor",
  },
  {
    label: "Safe & Certified",
    description: "Clinical-grade products",
    icon: "shield",
  },
  {
    label: "Visible Results",
    description: "Proven outcomes",
    icon: "sparkle",
  },
  {
    label: "Premium Care",
    description: "Personalised for you",
    icon: "award",
  },
];

export const treatments: Treatment[] = [
  {
    slug: "korean-glass-skin",
    title: "Korean Glass Treatment",
    price: 25000,
    priceLabel: "₹25,000",
    unit: "per session",
    tagline: "Premium Clinical Glow Experience",
    subtitle: "Premium Clinical Glow Experience",
    description:
      "Advanced Korean-inspired skincare treatment experience designed to deliver luminous glass skin results through premium protocols and guided sessions.",
    overview:
      "Inspired by the iconic Korean K-Beauty protocol, this premium clinical treatment is organized through beauty events, skin camps, and city-based treatment campaigns. This multi-step treatment hydrates from within, refines pores, and locks in a luminous, mirror-like dewy finish — the signature 'glass skin' look loved worldwide.",
    benefits: [
      "Deep hydration glow",
      "Smooth radiant skin",
      "Glass skin finish",
      "Brightening support",
      "Skin texture refinement",
      "Luxury clinical care",
    ],
    process: [
      {
        step: "Event Registration",
        detail: "Register for upcoming glass skin treatment events in your city.",
      },
      {
        step: "Expert Consultation",
        detail: "One-on-one consultation with Korean skincare specialists.",
      },
      {
        step: "Premium Treatment",
        detail: "Multi-step clinical protocol with premium Korean-import products.",
      },
      {
        step: "Glass Skin Results",
        detail: "Experience instant luminous dewy finish and visible transformation.",
      },
      {
        step: "Aftercare Support",
        detail: "Post-treatment guidance and home-care recommendations.",
      },
    ],
    whoFor: [
      "Dry, dull, or tired-looking skin",
      "Anyone wanting that K-Beauty dewy glow",
      "Pre-event glow boost",
      "Mature skin needing hydration & bounce",
    ],
    safety:
      "Doctor-supervised, hypoallergenic, and patch-tested. All Korean-import grade products are dermatologically certified. Organized in premium clinical settings.",
    faqs: [
      {
        q: "How do I book this treatment?",
        a: "This treatment is organized through city-based campaigns and beauty events. Register your interest and we'll notify you when sessions are available in your city.",
      },
      {
        q: "Which cities currently offer this treatment?",
        a: "We organize glass skin treatment campaigns in major cities. Check our website or WhatsApp for upcoming events in your area.",
      },
      {
        q: "How long do results last?",
        a: "The instant dewy finish lasts ~7–10 days. With recommended sessions and proper aftercare, you can sustain the effect for longer.",
      },
    ],
    duration: "75–90 min",
    sessions: "Event-based sessions",
    badge: "Premium",
    icon: "sparkle",
    tone: "primary",
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Korean Glass Skin treatment — luminous dewy radiant skin with glass-like finish",
    treatmentType: "camp",
    note: "Clinic and campaign-based premium experience.",
  },
  {
    slug: "skin-lightening",
    title: "Skin Lightening Treatment",
    price: 18000,
    priceLabel: "₹18,000",
    unit: "one-time",
    tagline: "Premium Home Treatment Program",
    subtitle: "Premium Home Treatment Program",
    description:
      "Professional skin brightening and pigmentation care program designed for visible glow improvement from the comfort of your home.",
    overview:
      "Our Skin Lightening Treatment is a comprehensive home-based skincare program that delivers professional-grade brightening results through a premium treatment kit delivered directly to your home. This clinically formulated protocol targets melanin clusters, post-acne marks, and dull patches — restoring an even, radiant complexion with safe, dermat-approved actives.",
    benefits: [
      "Reduces pigmentation & dark spots",
      "Improves uneven skin tone",
      "Enhances natural glow",
      "Safe for Indian skin types",
      "Guided skincare support",
      "Long-lasting visible radiance",
    ],
    process: [
      {
        step: "Kit Delivery",
        detail: "Premium home care kit delivered to your doorstep with all required products.",
      },
      {
        step: "Video Consultation",
        detail: "Expert video consultation to guide you through the treatment protocol.",
      },
      {
        step: "Daily Routine",
        detail: "Follow the guided skincare routine with premium clinical-grade actives.",
      },
      {
        step: "Progress Tracking",
        detail: "Weekly check-ins to monitor progress and adjust protocol as needed.",
      },
      {
        step: "Ongoing Support",
        detail: "Continuous online/offline consultation support throughout the program.",
      },
    ],
    whoFor: [
      "Uneven skin tone & dullness",
      "Post-acne marks & pigmentation",
      "Tan, sun damage, or dark patches",
      "Anyone seeking a brighter, balanced complexion",
    ],
    safety:
      "Doctor-supervised, patch-tested, and tailored for Indian skin. Uses certified clinical-grade products with zero harsh bleaching agents. Premium home care kit delivered with detailed instructions.",
    faqs: [
      {
        q: "What is included in the home treatment kit?",
        a: "The kit includes all premium clinical-grade products needed for the complete treatment program, along with detailed instructions and access to video consultations.",
      },
      {
        q: "How long does the program last?",
        a: "The standard program is designed for 4-6 weeks, with visible improvements typically seen within the first 2 weeks.",
      },
      {
        q: "Is there any downtime?",
        a: "No downtime. This is a gentle home-based treatment designed for daily use without disrupting your routine.",
      },
    ],
    duration: "4–6 weeks",
    sessions: "Complete home program",
    badge: "Home Program",
    icon: "droplet",
    tone: "accent",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Premium skincare home treatment kit with clinical-grade products",
    treatmentType: "home-kit",
    note: "Includes premium home care kit delivery.",
  },
  {
    slug: "basic-skin-treatment",
    title: "Basic Skin Treatment",
    price: 12000,
    priceLabel: "₹12,000",
    unit: "per session",
    tagline: "Essential Skin Health Foundation",
    description:
      "Build a strong foundation for healthy, glowing skin with our essential treatment that cleanses, nourishes, and protects.",
    overview:
      "The Basic Skin Treatment is designed as the cornerstone of any skincare routine. This fundamental protocol deeply cleanses pores, replenishes essential nutrients, and strengthens your skin's natural barrier — establishing the perfect base for lasting skin health and radiance.",
    benefits: [
      "Cleansing",
      "Hydration",
      "Skin refresh",
      "Glow maintenance",
      "Beginner-friendly skincare support",
    ],
    process: [
      {
        step: "Skin Analysis",
        detail: "Professional assessment of your skin type and condition.",
      },
      {
        step: "Deep Cleansing",
        detail: "Thorough pore cleansing to remove impurities and excess oil.",
      },
      {
        step: "Exfoliation",
        detail: "Gentle removal of dead skin cells for smoother texture.",
      },
      {
        step: "Nourishing Mask",
        detail: "Nutrient-rich mask to replenish and revitalize skin.",
      },
      {
        step: "Protection",
        detail: "Moisturizer and SPF to protect and maintain results.",
      },
    ],
    whoFor: [
      "Beginners to professional skincare",
      "Maintenance between advanced treatments",
      "General skin health improvement",
      "Preventative skincare",
      "All skin types",
    ],
    safety:
      "Gentle yet effective protocol suitable for all skin types. Doctor-supervised with patch-tested, clinical-grade products.",
    faqs: [
      {
        q: "Is this suitable for first-time skincare clients?",
        a: "Absolutely. This is our foundational treatment, perfect for anyone new to professional skincare or building a routine.",
      },
      {
        q: "How often should I get this treatment?",
        a: "For maintenance, we recommend every 4–6 weeks. Your therapist will create a personalized schedule based on your skin needs.",
      },
      {
        q: "Can I combine this with other treatments?",
        a: "Yes, this treatment pairs well with more advanced protocols. Your skincare expert will recommend the best combination for your goals.",
      },
    ],
    duration: "45–60 min",
    sessions: "Recommended 4–6 sessions",
    badge: "Essential",
    icon: "droplet",
    tone: "primary",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Basic Skin Treatment — clean, healthy, glowing skin foundation",
  },
  {
    slug: "japanese-skin-treatment",
    title: "Japanese Skin Treatment",
    price: 22000,
    priceLabel: "₹22,000",
    unit: "per session",
    tagline: "Refined Purity & Timeless Beauty",
    description:
      "Embrace the Japanese philosophy of skin purification — gentle yet powerful techniques for refined, porcelain-like skin with lasting clarity.",
    overview:
      "Rooted in the Japanese tradition of meticulous skincare, this treatment focuses on purification, refinement, and harmony. Using time-honored techniques combined with modern clinical science, it delivers porcelain-smooth skin with exceptional clarity and a refined, elegant finish.",
    benefits: [
      "Minimalist skin ritual",
      "Texture refinement",
      "Calm skin",
      "Natural radiance",
      "Balanced hydration",
    ],
    process: [
      {
        step: "Ritual Cleanse",
        detail: "Traditional Japanese cleansing technique for deep purification.",
      },
      {
        step: "Refining Exfoliation",
        detail: "Gentle enzyme exfoliation for smooth, refined texture.",
      },
      {
        step: "Essence Infusion",
        detail: "Lightweight essence layers for deep hydration and balance.",
      },
      {
        step: "Clay Mask",
        detail: "Purifying clay mask to detoxify and refine pores.",
      },
      {
        step: "Harmony Finish",
        detail: "Balancing moisturizer and protective SPF for lasting clarity.",
      },
    ],
    whoFor: [
      "Enlarged or visible pores",
      "Rough or uneven texture",
      "Oily or combination skin",
      "Those seeking refined elegance",
      "Sensitive or reactive skin",
    ],
    safety:
      "Doctor-supervised with gentle, purifying ingredients. All products are dermatologically tested and suitable for sensitive skin types.",
    faqs: [
      {
        q: "How is this different from the Korean Glass Treatment?",
        a: "While Korean Glass focuses on dewy hydration, Japanese treatment emphasizes purification, pore refinement, and achieving a smooth, porcelain-like finish.",
      },
      {
        q: "Is this suitable for sensitive skin?",
        a: "Yes, the Japanese approach is known for being gentle yet effective. We customize the intensity based on your skin sensitivity.",
      },
      {
        q: "When will I see results?",
        a: "Immediate refinement is visible after one session. For lasting porcelain-smooth skin, we recommend 4–6 sessions spaced 2–3 weeks apart.",
      },
    ],
    duration: "60–75 min",
    sessions: "Recommended 4–6 sessions",
    badge: "Refined",
    icon: "sparkle",
    tone: "light",
    image:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Japanese Skin Treatment — refined porcelain-smooth skin with clarity",
  },
  {
    slug: "advanced-skin-treatment",
    title: "Advanced Skin Treatment",
    price: 35000,
    priceLabel: "₹35,000",
    unit: "per session",
    tagline: "Clinical-Grade Skin Transformation",
    description:
      "Target complex skin concerns with our most powerful clinical protocol — advanced actives, intensive repair, and visible transformation.",
    overview:
      "The Advanced Skin Treatment represents the pinnacle of our clinical expertise. This intensive protocol combines high-potency actives, cutting-edge delivery systems, and doctor-supervised precision to address complex skin concerns including deep pigmentation, advanced aging, and significant texture irregularities.",
    benefits: [
      "Anti-aging",
      "Skin repair",
      "Deep hydration",
      "Pigmentation control",
      "Collagen boost",
      "Barrier strengthening",
    ],
    process: [
      {
        step: "Advanced Assessment",
        detail: "Comprehensive skin analysis with imaging technology.",
      },
      {
        step: "Professional Peel",
        detail: "Clinical-grade peel for deep exfoliation and renewal.",
      },
      {
        step: "Active Infusion",
        detail: "High-potency serums with advanced delivery systems.",
      },
      {
        step: "Intensive Mask",
        detail: "Professional-grade treatment mask for targeted repair.",
      },
      {
        step: "Barrier Restoration",
        detail: "Barrier-repair complex and protective aftercare protocol.",
      },
    ],
    whoFor: [
      "Deep or stubborn pigmentation",
      "Advanced signs of aging",
      "Severe texture irregularities",
      "Significant skin damage",
      "Those seeking dramatic results",
    ],
    safety:
      "Doctor-supervised with clinical-grade, high-potency actives. Requires pre-treatment assessment and strict aftercare compliance. Not suitable for pregnant or nursing clients.",
    faqs: [
      {
        q: "Is there downtime after this treatment?",
        a: "Yes, expect 3–5 days of mild redness and peeling as skin renews. This is normal and part of the transformation process.",
      },
      {
        q: "How many sessions are needed?",
        a: "Most clients see significant improvement in 2–3 sessions. A full course of 4–6 sessions is recommended for complete transformation.",
      },
      {
        q: "Am I a candidate for this treatment?",
        a: "A pre-treatment consultation is required. Our doctor will assess your skin, medical history, and goals to determine suitability.",
      },
    ],
    duration: "90–120 min",
    sessions: "Recommended 4–6 sessions",
    badge: "Advanced",
    icon: "award",
    tone: "primaryDark",
    image:
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Advanced Skin Treatment — clinical-grade skin transformation with visible results",
  },
];

export const referralLevels: ReferralLevel[] = [
  { level: "Level 1", label: "Direct Referral", rate: "6%" },
  { level: "Level 2", label: "Network Referral", rate: "3%" },
  { level: "Level 3", label: "Extended Reach", rate: "1.7%" },
  { level: "Level 4", label: "Deep Network", rate: "1.2%" },
];

export const salesBonuses: SalesBonus[] = [
  { bookings: 10, bonus: "₹5,000" },
  { bookings: 20, bonus: "₹10,000" },
  { bookings: 30, bonus: "₹15,000" },
];

export const testimonials: Testimonial[] = [
  {
    name: "Priya S.",
    city: "Ahmedabad",
    treatment: "Korean Glass Skin",
    quote:
      "My skin has never looked this smooth. The team is professional and the results showed from the second session itself.",
    rating: 5,
  },
  {
    name: "Riya M.",
    city: "Surat",
    treatment: "Skin Lightening",
    quote:
      "Pigmentation on my cheeks has visibly reduced. I feel confident going makeup-free now. Highly recommend IA Skin Care.",
    rating: 5,
  },
  {
    name: "Aarti K.",
    city: "Vadodara",
    treatment: "Korean Glass Skin",
    quote:
      "Premium experience from consultation to aftercare. Clean clinic, genuine advice, no upselling. Loved the glow!",
    rating: 5,
  },
];

export const faqs: FAQItem[] = [
  {
    q: "How do I book a consultation?",
    a: "Click any Book Now or Book Consultation button on this page to open our secure booking form. Our team confirms your slot on WhatsApp within a few hours.",
  },
  {
    q: "Are the treatments safe for Indian skin?",
    a: "Yes. All our protocols are doctor-supervised and tailored to Indian skin types using clinical-grade, certified products.",
  },
  {
    q: "When will I see results?",
    a: "Most clients notice visible improvement after 2 sessions. For best results we recommend the full course suggested during your consultation.",
  },
  {
    q: "Can I pay online?",
    a: "Online payment via Razorpay / Cashfree is being integrated. For now, our team will share a secure payment link after your booking is confirmed.",
  },
  {
    q: "What is the OZO Referral Membership?",
    a: "A ₹1,199 optional membership that unlocks commissions when you refer clients for IA Skin Care treatments. It is completely optional — you don't need it to book a treatment.",
  },
  {
    q: "Do I have to buy a membership to take a treatment?",
    a: "No. Treatments are open to everyone. Membership is only for people who want to earn commission by referring others.",
  },
];
