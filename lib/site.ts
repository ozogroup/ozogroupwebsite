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
    { label: "Treatments", href: "#treatments" },
    { label: "About", href: "#about" },
    { label: "Referral", href: "#referrals" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
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
    slug: "skin-lightening",
    title: "Skin Lightening Treatment",
    price: 18000,
    priceLabel: "₹18,000",
    unit: "per session",
    tagline: "Brighter, even-toned skin",
    description:
      "Improves uneven skin tone, dullness, and pigmentation for a brighter, more balanced look.",
    overview:
      "Our Skin Lightening Treatment is a clinically formulated protocol that targets melanin clusters, post-acne marks, and dull patches — restoring an even, radiant complexion with safe, dermat-approved actives.",
    benefits: [
      "Reduces pigmentation & dark spots",
      "Evens out skin tone",
      "Restores natural radiance",
      "Safe for Indian skin types",
      "Improves overall skin clarity",
      "Long-lasting visible glow",
    ],
    process: [
      {
        step: "Skin Assessment",
        detail: "Expert evaluation of your skin type, concerns, and goals.",
      },
      {
        step: "Deep Cleanse & Prep",
        detail: "Gentle pore cleansing and pH balancing for product absorption.",
      },
      {
        step: "Brightening Actives",
        detail:
          "Application of clinical-grade vitamin C, niacinamide, and pigment-correctors.",
      },
      {
        step: "Targeted Mask",
        detail: "Cooling brightening mask infused with antioxidant complex.",
      },
      {
        step: "SPF & Aftercare",
        detail: "Broad-spectrum SPF + a personalised home-care plan.",
      },
    ],
    whoFor: [
      "Uneven skin tone & dullness",
      "Post-acne marks & pigmentation",
      "Tan, sun damage, or dark patches",
      "Anyone seeking a brighter, balanced complexion",
    ],
    safety:
      "Doctor-supervised, patch-tested, and tailored for Indian skin. Uses certified clinical-grade products with zero harsh bleaching agents.",
    faqs: [
      {
        q: "How many sessions will I need?",
        a: "Most clients see visible results in 2 sessions; 4–6 sessions deliver the best long-term outcome. Your therapist will recommend the right plan after consultation.",
      },
      {
        q: "Is there any downtime?",
        a: "No downtime. You may experience mild redness for an hour, after which you can resume your routine immediately.",
      },
      {
        q: "Is it safe for sensitive skin?",
        a: "Yes — protocols are adjusted to your skin type. We always do a patch test before the first session.",
      },
    ],
    duration: "60–75 min",
    sessions: "Recommended 4–6 sessions",
    badge: "Most Popular",
    icon: "droplet",
    tone: "accent",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Premium skincare treatment — bright, radiant, even-toned skin",
  },
  {
    slug: "korean-glass-skin",
    title: "Korean Glass Skin Treatment",
    price: 25000,
    priceLabel: "₹25,000",
    unit: "per session",
    tagline: "Smooth, radiant, glass-like glow",
    description:
      "A premium glow-focused treatment for smooth, radiant, glass-like skin.",
    overview:
      "Inspired by the iconic Korean K-Beauty protocol, this multi-step treatment hydrates from within, refines pores, and locks in a luminous, mirror-like dewy finish — the signature 'glass skin' look loved worldwide.",
    benefits: [
      "Deep hydration & plumping",
      "Refines pores & texture",
      "Locks in a dewy finish",
      "Boosts skin elasticity",
      "Smooths fine lines",
      "Korean multi-step protocol",
    ],
    process: [
      {
        step: "Double Cleanse",
        detail: "Oil-based + water-based cleanse to fully clarify the skin.",
      },
      {
        step: "Gentle Exfoliation",
        detail: "Removes dead cells for next-step actives to penetrate deeply.",
      },
      {
        step: "Hydration Infusion",
        detail:
          "Layered hyaluronic acid + peptide serums for instant plumping.",
      },
      {
        step: "Glass Skin Mask",
        detail: "Signature glow mask for radiant translucency and bounce.",
      },
      {
        step: "Lock-in & Finish",
        detail: "Sealing emulsion, eye care, and SPF for the final glass finish.",
      },
    ],
    whoFor: [
      "Dry, dull, or tired-looking skin",
      "Anyone wanting that K-Beauty dewy glow",
      "Pre-event glow boost",
      "Mature skin needing hydration & bounce",
    ],
    safety:
      "Doctor-supervised, hypoallergenic, and patch-tested. All Korean-import grade products are dermatologically certified.",
    faqs: [
      {
        q: "How long does the glow last?",
        a: "The instant dewy finish lasts ~7–10 days. With recommended 3–5 sessions, you can sustain the effect for months.",
      },
      {
        q: "Is this just a facial?",
        a: "No — it's a multi-step clinical protocol with serums, masks, and infusions used in licensed Korean dermatology clinics.",
      },
      {
        q: "Will it work on oily skin?",
        a: "Absolutely. The protocol is balanced and tailored — oily skin types often see the best refining results.",
      },
    ],
    duration: "75–90 min",
    sessions: "Recommended 3–5 sessions",
    badge: "Premium",
    icon: "sparkle",
    tone: "primary",
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80",
    imageAlt:
      "Korean Glass Skin treatment — luminous dewy radiant skin",
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
