import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { BookingProvider } from "@/components/booking/BookingContext";
import { getPublicSiteContent } from "@/lib/data/public";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ozogroupwebsite.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getPublicSiteContent("seo");

  return {
    metadataBase: new URL(siteUrl),
    title: siteContent.seo_title || "OZO Skin Care | Luxury Korean & Japanese Skincare Treatments",
    description:
      siteContent.seo_description ||
      "Experience premium skincare treatments at OZO Skin Care. Korean Glass Treatment, Japanese kits, and premium skincare protocols for visible transformation. Doctor-supervised luxury skincare.",
    keywords: siteContent.seo_keywords ? siteContent.seo_keywords.split(",") : [
      "OZO Skin Care",
      "Korean Glass Treatment",
      "Japanese Skincare",
      "Advance Kit",
      "Korean Glass Kit",
      "Luxury Skincare Clinic",
      "Skin Treatment India",
      "Premium Skincare",
      "Clinical Dermatology",
      "Glass Skin Treatment",
    ],
    authors: [{ name: "The Gujarati Designer", url: "https://www.thegujaratidesigner.in" }],
    icons: {
      icon: "/logos/ozo-service-icon.png",
      apple: "/logos/ozo-service-icon.png",
    },
    openGraph: {
      title: siteContent.og_title || "OZO Skin Care · Premium Luxury Skincare",
      description:
        siteContent.og_description ||
        "Transform your skin with luxury Korean and Japanese skincare treatments. Doctor-supervised clinical protocols for visible, lasting results.",
      type: "website",
      images: ["/logos/ozo-service-logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/logos/ozo-service-logo.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0D5C7D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-white text-brand-ink antialiased">
        <BookingProvider>
          {children}
        </BookingProvider>
      </body>
    </html>
  );
}
