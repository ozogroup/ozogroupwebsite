import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80";

const heroPoints = [
  "Advanced Skin Treatments",
  "Doctor-Supervised Protocols",
  "Premium Clinical Care",
  "Visible Results",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Premium background glow with Korean aesthetic */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%, rgba(27,163,198,0.15) 0%, rgba(255,255,255,0) 50%), radial-gradient(ellipse at 20% 100%, rgba(93,169,214,0.12) 0%, rgba(255,255,255,0) 50%), linear-gradient(180deg, rgba(245,250,252,0.5) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      <div className="container-x pt-12 md:pt-20 pb-16 md:pb-24 lg:pb-28 grid gap-12 lg:gap-16 lg:grid-cols-12 items-center">
        {/* Copy */}
        <div className="lg:col-span-6 animate-fadeUp">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              IA Skin Care · Premium Division
            </span>
          </div>
          
          <h1 className="mt-6 md:mt-8 leading-[1.1]">
            Luxury Skin Treatments for{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                Radiant Transformation
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-brand-accent/20 to-brand-light/20 blur-xl -z-10" />
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-brand-muted max-w-xl leading-relaxed">
            Doctor-supervised skincare experiences inspired by Korean and Japanese beauty protocols.
          </p>

          {/* Premium trust points */}
          <ul className="mt-8 grid grid-cols-2 gap-4">
            {heroPoints.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-brand-ink/90 font-medium">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent to-brand-light text-white shadow-glow">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <BookNowButton className="justify-center shadow-soft hover:shadow-card transition-shadow">
              Book Free Consultation
            </BookNowButton>
            <Link href="#treatments" className="btn-secondary justify-center">
              Explore Treatments
            </Link>
          </div>

          {/* Social proof with premium styling */}
          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex -space-x-3">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-10 w-10 rounded-full ring-3 ring-white shadow-soft"
                  style={{
                    background: `linear-gradient(135deg, ${i % 2 === 0 ? '#1BA3C6' : '#5DA9D6'}, ${i === 0 ? '#0D5C7D' : i === 1 ? '#1BA3C6' : '#5DA9D6'})`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <p className="text-sm text-brand-ink">
                <span className="font-semibold text-brand-primary">500+</span> happy clients
              </p>
              <span className="hidden sm:inline text-brand-muted">·</span>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-brand-accent">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-brand-accent">4.9/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual with glassmorphism */}
        <div className="lg:col-span-6 animate-fadeUp" style={{ animationDelay: "0.15s" }}>
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] w-full rounded-[32px] border border-brand-border/50 shadow-premium overflow-hidden bg-gradient-to-br from-brand-surface to-white">
              <Image
                src={HERO_IMAGE}
                alt="Premium skincare treatment at IA Skin Care clinic"
                fill
                sizes="(max-width: 1024px) 90vw, 600px"
                priority
                className="object-cover"
              />
              {/* Premium brand wash */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-brand-accent/10"
              />
              {/* Glass overlay at bottom */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/80 via-white/40 to-transparent backdrop-blur-xs"
              />
            </div>

            {/* Floating result card with glassmorphism */}
            <div className="absolute -bottom-8 -left-4 md:-left-10 bg-white/90 backdrop-blur-md rounded-3xl border border-brand-border/50 shadow-glass p-5 max-w-[260px] animate-float">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-accent to-brand-light flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-[11px] uppercase tracking-wider text-brand-accent font-semibold">
                  Visible Results
                </p>
              </div>
              <p className="text-base font-semibold text-brand-ink">
                Glow in 2 weeks
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Clinical protocols backed
              </p>
            </div>

            {/* Floating safety badge with premium styling */}
            <div className="absolute -top-6 -right-4 md:-right-10 bg-white/90 backdrop-blur-md rounded-3xl border border-brand-border/50 shadow-glass p-5 max-w-[240px] animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-soft">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-ink">Doctor-Supervised</p>
                  <p className="text-xs text-brand-muted mt-0.5">Certified protocols</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
