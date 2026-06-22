import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";

const GLASS_IMAGE =
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80";

export default function KoreanGlassHighlight() {
  return (
    <section className="bg-gradient-to-b from-white to-brand-surface/50 py-8 md:py-12">
      <div className="container-x">
        <div className="grid items-center gap-7 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 animate-fadeUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Signature Treatment
              </span>
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl">
              Korean Glass Treatment Campaign
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-brand-muted">
              Campaign/location-based premium Korean glass treatment. Our team will contact you on WhatsApp with campaign date and location details.
            </p>

            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                "Deep hydration",
                "Luminous glow",
                "Smoother skin texture",
                "Anti-aging support",
                "Brighter tone",
                "Instant freshness",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-brand-ink/90">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent to-brand-light text-white shadow-glow">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <BookNowButton treatmentSlug="korean-glass-treatment" className="justify-center shadow-soft hover:shadow-card transition-shadow">
                Enquire Now
              </BookNowButton>
              <Link href="/treatments/korean-glass-treatment" className="btn-secondary justify-center">
                Learn More
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 animate-fadeUp" style={{ animationDelay: "0.15s" }}>
            <div className="relative mx-auto aspect-[4/3] max-h-[300px] w-full max-w-xl overflow-hidden rounded-3xl border border-brand-border/60 bg-gradient-to-br from-brand-surface to-white shadow-premium md:max-h-[360px] lg:max-h-[400px]">
              <Image
                src={GLASS_IMAGE}
                alt="Korean Glass Treatment Campaign - luminous dewy radiant skin"
                fill
                sizes="(max-width: 1024px) 90vw, 600px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-brand-accent/10"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/80 via-white/40 to-transparent backdrop-blur-xs"
              />
              <span className="absolute top-5 left-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-brand-border/50 shadow-glass">
                Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

