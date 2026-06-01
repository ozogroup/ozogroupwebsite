import { treatmentKitCatalog } from "@/lib/treatments/catalog";
import type {
  Treatment,
  ReferralLevel,
  SalesBonus,
  Testimonial,
  FAQItem,
  TrustBadge,
} from "@/types";

export const site = {
  parent: "KIA Skin Care",
  brand: "KIA Skin Care",
  division: "KIA Skin Care Partner Program",
  tagline: "Glow Better. Earn Smarter.",
  phone: "+91 76986 17054",
  phoneRaw: "+917698617054",
  whatsapp:
    "https://wa.me/917698617054?text=Hello%20KIA%20Skin%20Care%2C%20I%20want%20to%20book%20a%20skincare%20consultation.",
  email: "",
  instagram: "",
  address: "KIA Skin Care\nD-25, 1st Floor, New Bus Port, Palanpur\nDist. B.K\nPIN Code: 385001",
  businessHours: "10:00 AM to 6:00 PM",
  weeklyOff: "Sunday Off",
  membershipFee: 1199,
  // TODO: Future franchise inquiry form fields: Name, Phone, City, Investment Budget, Message.
  franchiseRequirementFields: ["Name", "Phone", "City", "Investment Budget", "Message"],
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

export const treatments: Treatment[] = treatmentKitCatalog.map((treatment) => ({
  slug: treatment.slug,
  title: treatment.title,
  price: treatment.price,
  priceLabel: treatment.priceLabel,
  unit: treatment.unit,
  tagline: treatment.tagline,
  subtitle: treatment.subtitle,
  description: treatment.description,
  overview: treatment.overview,
  benefits: [...treatment.benefits],
  process: [],
  whoFor: [...treatment.whoFor],
  safety: treatment.safety,
  faqs: [],
  duration: treatment.duration,
  sessions: treatment.sessions,
  badge: treatment.badge,
  icon: treatment.icon,
  tone: treatment.tone,
  image: treatment.image,
  imageAlt: treatment.imageAlt,
  treatmentType: treatment.treatmentType,
  note: treatment.note,
}));
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
    treatment: "Korean Glass Treatment Campaign",
    quote:
      "My skin has never looked this smooth. The team is professional and the results showed from the second session itself.",
    rating: 5,
  },
  {
    name: "Riya M.",
    city: "Surat",
    treatment: "Advance Kit",
    quote:
      "Pigmentation support has been easier with the guided Advance Kit. Highly recommend KIA Skin Care.",
    rating: 5,
  },
  {
    name: "Aarti K.",
    city: "Vadodara",
    treatment: "Korean Glass Kit",
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
    q: "What is the KIA Skin Care Partner Program?",
    a: "A ₹1,199 optional membership that unlocks commissions when you refer clients for KIA Skin Care treatments. It is completely optional — you don't need it to book a treatment.",
  },
  {
    q: "Do I have to buy a membership to take a treatment?",
    a: "No. Treatments are open to everyone. Membership is only for people who want to earn commission by referring others.",
  },
];

