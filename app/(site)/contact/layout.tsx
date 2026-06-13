import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact KIA Skin Care | Premium Skincare Consultation",
  description: "Get in touch with KIA Skin Care for premium skincare consultations. Book appointments or learn more about our treatments.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
