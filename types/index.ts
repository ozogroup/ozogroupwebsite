export type Treatment = {
  slug: string;
  title: string;
  price: number;
  priceLabel: string;
  unit: string;
  tagline: string;
  subtitle?: string;
  description: string;
  overview: string;
  benefits: string[];
  process: { step: string; detail: string }[];
  whoFor: string[];
  safety: string;
  faqs: FAQItem[];
  duration: string;
  sessions: string;
  badge?: string;
  icon: "sparkle" | "droplet" | "leaf" | "award";
  tone: "primary" | "accent" | "light" | "primaryDark";
  image: string;
  imageAlt: string;
  treatmentType?: "home-kit" | "clinic" | "camp";
  note?: string;
};

export type ReferralLevel = {
  level: string;
  label: string;
  rate: string;
};

export type SalesBonus = {
  bookings: number;
  bonus: string;
};

export type Testimonial = {
  name: string;
  city: string;
  treatment: string;
  quote: string;
  rating: number;
};

export type FAQItem = {
  q: string;
  a: string;
};

export type TrustBadge = {
  label: string;
  description: string;
  icon: "shield" | "award" | "doctor" | "sparkle";
};
