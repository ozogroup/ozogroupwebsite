import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { BookingProvider } from "@/components/booking/BookingContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OZO Skin Care | Luxury Korean & Japanese Skincare Treatments",
  description:
    "Experience premium skincare treatments at OZO Skin Care. Korean Glass Skin, Japanese purification, and advanced clinical protocols for visible transformation. Doctor-supervised luxury skincare.",
  keywords: [
    "OZO Skin Care",
    "Korean Glass Skin",
    "Japanese Skincare",
    "Advanced Skin Treatment",
    "Luxury Skincare Clinic",
    "Skin Treatment India",
    "Premium Skincare",
    "Clinical Dermatology",
    "Glass Skin Treatment",
  ],
  authors: [{ name: "The Gujarati Designer", url: "https://www.thegujaratidesigner.in" }],
  icons: {
    icon: "/logos/ozo-group-logo.png",
    apple: "/logos/ozo-group-logo.png",
  },
  openGraph: {
    title: "OZO Skin Care · Premium Luxury Skincare",
    description:
      "Transform your skin with luxury Korean and Japanese skincare treatments. Doctor-supervised clinical protocols for visible, lasting results.",
    type: "website",
  },
};

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
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <WhatsAppFloat />
        </BookingProvider>
      </body>
    </html>
  );
}
