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
  title: "IA Skin Care | Professional Skincare That Works · OZO Group",
  description:
    "IA Skin Care is the premium skincare division of OZO Group. Advanced clinical treatments — Skin Lightening, Korean Glass Skin & more. Glow Better. Earn Smarter.",
  keywords: [
    "IA Skin Care",
    "OZO Group",
    "skin lightening",
    "Korean glass skin",
    "skincare clinic",
    "skin treatment India",
  ],
  authors: [{ name: "The Gujarati Designer", url: "https://www.thegujaratidesigner.in" }],
  icons: {
    icon: "/logos/ozo-group-logo.png",
    apple: "/logos/ozo-group-logo.png",
  },
  openGraph: {
    title: "IA Skin Care · OZO Group",
    description:
      "Professional skincare treatments by IA Skin Care, a premium division of OZO Group.",
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
