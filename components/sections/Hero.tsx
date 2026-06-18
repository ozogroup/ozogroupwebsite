import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";
import { getPublicSiteContent, getPublicSystemSettings } from "@/lib/data/public";

const HERO_IMAGE = "/images/client-approved/home-hero-korean-skincare.png";
const LEGACY_HERO_IMAGES = new Set([
  "/images/client-approved/korean-glass-treatment-kit.jpeg",
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80",
]);

const defaultHeroPoints = [
  "Premium Treatment Kits",
  "Doctor-Supervised Protocols",
  "Premium Clinical Care",
  "Visible Results",
];

export default async function Hero() {
  const [siteContent, systemSettings] = await Promise.all([
    getPublicSiteContent("home_hero"),
    getPublicSystemSettings(),
  ]);

  const heroTitle = siteContent.hero_title || "Luxury Skin Treatments for Radiant Transformation";
  const heroSubtitle =
    siteContent.hero_description ||
    siteContent.hero_subtitle ||
    "Doctor-supervised skincare experiences inspired by Korean and Japanese beauty protocols.";
  const configuredHeroImage = siteContent.hero_image;
  const heroImage =
    configuredHeroImage && !LEGACY_HERO_IMAGES.has(configuredHeroImage)
      ? configuredHeroImage
      : HERO_IMAGE;
  const primaryButtonText = siteContent.primary_button_text || "Book Free Consultation";
  const secondaryButtonText = siteContent.secondary_button_text || "Explore Treatments";
  const secondaryButtonLink = siteContent.secondary_button_link || "#treatments";
  const heroPoints = systemSettings.heroPoints?.length > 0
    ? systemSettings.heroPoints
    : defaultHeroPoints;

  return (
    <section className="relative flex min-h-[76svh] items-center overflow-hidden bg-brand-ink text-white">
      <Image
        src={heroImage}
        alt="KIA Skin Care premium Korean skincare treatment"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[64%_center] sm:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2f2927]/95 via-[#3d3531]/76 to-[#302a27]/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2f2927]/78 via-transparent to-[#2f2927]/20" />

      <div className="container-x relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl animate-fadeUp">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#d9c896]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              KIA Skin Care
            </span>
          </div>

          <h1 className="mt-6 max-w-2xl text-white drop-shadow-sm sm:mt-8">
            {heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg md:text-xl">
            {heroSubtitle}
          </p>

          <ul className="mt-7 grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {heroPoints.map((point: string) => (
              <li
                key={point}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-white/15 bg-black/15 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9CAF88] text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BookNowButton className="justify-center border border-white/10 bg-white text-brand-ink hover:bg-brand-surface">
              {primaryButtonText}
            </BookNowButton>
            <Link
              href={secondaryButtonLink}
              className="btn justify-center border border-white/45 bg-black/15 text-white backdrop-blur-sm hover:bg-white/15"
            >
              {secondaryButtonText}
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-white/75">
            <span className="font-semibold text-white">500+ happy clients</span>
            <span aria-hidden>|</span>
            <span className="text-[#eadba9]">Rated 4.9/5</span>
          </div>
        </div>
      </div>
    </section>
  );
}
