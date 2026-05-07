import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";
import { treatments } from "@/lib/site";

export default function Treatments() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Premium Treatments
            </span>
          </div>
          <h2 className="mt-6">Advanced Skincare Solutions</h2>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Choose between premium home treatment programs or exclusive clinical experiences 
            designed for visible, lasting results.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {treatments.map((treatment, i) => (
            <div
              key={treatment.slug}
              className="card hover:-translate-y-1 transition-transform duration-300 flex flex-col"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-surface to-white">
                <Image
                  src={treatment.image}
                  alt={treatment.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-brand-accent/10"
                />
                {treatment.badge && (
                  <span className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white bg-brand-primary/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-glass">
                    {treatment.badge}
                  </span>
                )}
              </div>

              <div className="mt-6 flex-1 flex flex-col">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-brand-accent mb-2">
                  {treatment.tagline}
                </p>
                <h3 className="text-xl font-semibold text-brand-ink mb-3">
                  {treatment.title}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed mb-6 flex-1">
                  {treatment.description}
                </p>

                <div className="mb-4 space-y-2">
                  {treatment.benefits.slice(0, 4).map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-brand-ink/90">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-brand-border/60">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-2xl font-bold text-brand-primary">
                      {treatment.priceLabel}
                    </p>
                    <span className="text-sm text-brand-muted">
                      {treatment.unit}
                    </span>
                  </div>
                  {treatment.note && (
                    <p className="text-xs text-brand-muted mb-4">
                      {treatment.note}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    {treatment.treatmentType === "home-kit" ? (
                      <Link
                        href={`/treatments/${treatment.slug}`}
                        className="btn-primary justify-center text-sm"
                      >
                        Book Home Kit Program
                      </Link>
                    ) : (
                      <a
                        href="#consultation"
                        className="btn-primary justify-center text-sm"
                      >
                        Book Consultation
                      </a>
                    )}
                    <Link
                      href={`/treatments/${treatment.slug}`}
                      className="btn-secondary justify-center text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-base text-brand-muted mb-4">
            Unsure which treatment is right for your skin?
          </p>
          <BookNowButton className="justify-center">
            Get Free Consultation
          </BookNowButton>
        </div>
      </div>
    </section>
  );
}
