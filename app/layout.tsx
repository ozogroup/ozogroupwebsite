import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { BookingProvider } from "@/components/booking/BookingContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://kiaskincare.in").replace(/\/$/, "");
const title = "KIA Skin Care | Premium Skincare & Partner Program";
const description =
  "Premium skincare kits, Korean glass treatment campaign, and partner referral program by KIA Skin Care.";

export const viewport: Viewport = {
  themeColor: "#9CAF92",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "KIA Skin Care",
    "premium skincare",
    "Korean glass treatment",
    "skincare kits",
    "partner referral program",
  ],
  authors: [{ name: "KIA Skin Care" }],
  icons: {
    icon: "/logos/kia-skin-care-logo.png",
    apple: "/logos/kia-skin-care-logo.png",
  },
  openGraph: {
    url: siteUrl,
    siteName: "KIA Skin Care",
    title,
    description,
    type: "website",
    images: ["/logos/kia-skin-care-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logos/kia-skin-care-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-brand-surface text-brand-ink antialiased">
        <BookingProvider>
          {children}
        </BookingProvider>
      </body>
    </html>
  );
}
