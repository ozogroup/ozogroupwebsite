import type { MetadataRoute } from "next";
import { treatmentKitSlugs } from "@/lib/treatments/catalog";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://kiaskincare.in").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/about", "/contact", "/membership", "/referral", "/treatments"];
  return [
    ...staticRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.8,
    })),
    ...treatmentKitSlugs.map((slug) => ({
      url: `${siteUrl}/treatments/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
