import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1400&q=80";

const heroPoints = [
  "Advanced Skin Treatments",
  "Safe Process",
  "Premium Care",
  "Easy Booking",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 55% at 85% 0%, rgba(27,163,198,0.20) 0%, rgba(255,255,255,0) 60%), radial-gradient(45% 55% at 0% 15%, rgba(93,169,214,0.18) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      <div className="container-x pt-10 md:pt-16 pb-14 md:pb-20 grid gap-12 lg:gap-16 lg:grid-cols-12 items-center">
        {/* Copy */}
        <div className="lg:col-span-6 animate-fadeUp">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            IA Skin Care · A Division of OZO Group
          </span>
          <h1 className="mt-5">
            Premium Skin Treatments for{" "}
            <span className="text-brand-accent">Visible Results</span>
          </h1>
          <p className="mt-5 text-lg max-w-xl">
            IA Skin Care by OZO GROUP offers advanced skincare treatments
            designed to improve glow, tone, texture, and confidence — with
            safe, doctor-supervised protocols.
          </p>

          {/* Trust points */}
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {heroPoints.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-brand-ink/80">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <BookNowButton className="justify-center">Book Consultation</BookNowButton>
            <Link href="#treatments" className="btn-secondary justify-center">
              Explore Treatments
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-5 text-sm text-brand-muted">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-8 w-8 rounded-full ring-2 ring-white"
                  style={{
                    background: `linear-gradient(135deg, #1BA3C6, #5DA9D6 ${i * 25}%, #0D5C7D)`,
                  }}
                />
              ))}
            </div>
            <p>
              <span className="font-semibold text-brand-ink">500+</span> happy
              clients · <span className="text-brand-accent font-medium">★ 4.9/5</span>
            </p>
          </div>
        </div>

        {/* Visual */}
        <div className="lg:col-span-6 animate-fadeUp">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="relative aspect-[4/5] w-full rounded-[28px] border border-brand-border shadow-card overflow-hidden">
              <Image
                src={HERO_IMAGE}
                alt="Premium skincare treatment at IA Skin Care clinic"
                fill
                sizes="(max-width: 1024px) 90vw, 600px"
                priority
                className="object-cover"
              />
              {/* Soft brand wash for cohesion */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-brand-primary/25 via-transparent to-brand-accent/15"
              />
            </div>

            {/* Floating result card */}
            <div className="absolute -bottom-6 -left-3 md:-left-8 bg-white rounded-2xl border border-brand-border shadow-card p-4 max-w-[230px]">
              <p className="text-[10px] uppercase tracking-wider text-brand-accent font-semibold">
                Real Result
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-ink">
                Visible glow in 2 weeks
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Backed by clinical protocols
              </p>
            </div>

            {/* Floating safety badge */}
            <div className="absolute -top-4 -right-3 md:-right-6 bg-white rounded-2xl border border-brand-border shadow-card p-4 max-w-[210px]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <p className="text-sm font-semibold text-brand-ink">Doctor-supervised</p>
              </div>
              <p className="mt-1 text-xs text-brand-muted">Safe, certified protocols</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
