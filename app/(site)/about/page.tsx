import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { getPublicSiteContent } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "About KIA Skin Care | Premium Skincare",
  description: "Learn about KIA Skin Care and our doctor-supervised Korean and Japanese skincare treatments.",
  alternates: { canonical: "/about" },
};

const ABOUT_IMAGE = "/images/client-approved/home-hero-korean-skincare.png";

export default async function AboutPage() {
  const siteContent = await getPublicSiteContent("about");
  const aboutTitle = siteContent.about_title || siteContent.title || "Premium Skincare, Redefined";
  const aboutContent =
    siteContent.about_description ||
    siteContent.description ||
    "KIA Skin Care offers advanced clinical treatments with visible, lasting results inspired by Korean and Japanese beauty traditions.";
  const mission =
    siteContent.about_mission ||
    siteContent.mission ||
    "We believe that everyone deserves access to premium skincare that delivers visible, lasting results. Our mission is to make advanced clinical treatments accessible, safe, and effective for all skin types.";
  const vision =
    siteContent.about_vision ||
    siteContent.vision ||
    "To become India's most trusted skincare destination, known for visible results, ethical practices, and customer-centric care.";
  const configuredAboutImage = siteContent.about_image || siteContent.image;
  const aboutImage = configuredAboutImage && /^https?:\/\//i.test(configuredAboutImage)
    ? configuredAboutImage
    : ABOUT_IMAGE;

  return (
    <>
      {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at 80% 0%, rgba(156,175,146,0.20) 0%, rgba(244,235,220,0) 50%), radial-gradient(ellipse at 20% 100%, rgba(220,230,214,0.58) 0%, rgba(244,235,220,0) 50%)",
            }}
          />
          <div className="container-x pt-12 md:pt-16 pb-16 md:pb-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  About Us
                </span>
              </div>
              <h1 className="mt-6">{aboutTitle}</h1>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl leading-relaxed">
                {aboutContent}
              </p>
            </div>
          </div>
        </section>

        {/* Image Section */}
        <section className="section">
          <div className="container-x">
            <div className="relative aspect-[16/9] w-full max-w-5xl mx-auto rounded-[32px] border border-brand-border/60 shadow-premium overflow-hidden bg-gradient-to-br from-brand-surface to-white">
              <Image
                src={aboutImage}
                alt="Premium skincare treatment at KIA Skin Care"
                fill
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-contain"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-brand-accent/10"
              />
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="section bg-gradient-to-b from-white to-brand-surface/50">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Our Mission
                </span>
              </div>
              <h2 className="mt-6">
                Transforming Skin,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                  One Treatment at a Time
                </span>
              </h2>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                {mission}
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Our Vision
                </span>
              </div>
              <p className="mt-6 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                {vision}
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="section">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Our Values
                </span>
              </div>
              <h2 className="mt-6">What We Stand For</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Safety First",
                  desc: "Doctor-supervised protocols with certified clinical-grade products",
                },
                {
                  title: "Visible Results",
                  desc: "Treatments designed to deliver noticeable, lasting improvements",
                },
                {
                  title: "Personalized Care",
                  desc: "Every treatment tailored to your unique skin type and goals",
                },
                {
                  title: "Premium Quality",
                  desc: "Luxury experience with clinical-grade products and protocols",
                },
              ].map((value, i) => (
                <div
                  key={value.title}
                  className="card hover:-translate-y-1 transition-transform duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-brand-ink">{value.title}</h3>
                  <p className="mt-2 text-sm text-brand-muted leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted text-white">
          <div className="container-x text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl text-white">
                Ready to Transform Your Skin?
              </h2>
              <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                Book a free consultation with our skincare experts and discover the perfect 
                treatment for your unique skin needs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/treatments"
                  className="inline-flex items-center justify-center rounded-full bg-white text-brand-ink px-8 py-4 text-sm font-semibold hover:bg-brand-surface transition-colors"
                >
                  Explore Treatments
                </Link>
                <a
                  href={`tel:${site.phoneRaw}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/40 text-white px-8 py-4 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Call {site.phone}
                </a>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
