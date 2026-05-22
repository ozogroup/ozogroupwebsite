import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";

const GLASS_IMAGE =
  "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80";

export default function KoreanGlassHighlight() {
  return (
    <section className="section bg-gradient-to-b from-white to-brand-surface/50">
      <div className="container-x">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 animate-fadeUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Signature Treatment
              </span>
            </div>
            <h2 className="mt-6">
              Korean Glass Treatment{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                Treatment
              </span>
            </h2>
            <p className="mt-4 text-lg text-brand-muted max-w-xl leading-relaxed">
              Experience the legendary Korean glass skin protocol — deep hydration, pore refinement, 
              and luminous translucency for that signature mirror-like finish.
            </p>

            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <BookNowButton treatmentSlug="korean-glass-treatment" className="justify-center shadow-soft hover:shadow-card transition-shadow">
                Book Korean Glass Treatment
              </BookNowButton>
              <Link href="/treatments/korean-glass-treatment" className="btn-secondary justify-center">
                Learn More
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 animate-fadeUp" style={{ animationDelay: "0.15s" }}>
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none rounded-[32px] border border-brand-border/60 shadow-premium overflow-hidden bg-gradient-to-br from-brand-surface to-white">
              <Image
                src={GLASS_IMAGE}
                alt="Korean Glass Treatment — luminous dewy radiant skin"
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
