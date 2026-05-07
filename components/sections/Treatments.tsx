import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";
import { treatments } from "@/lib/site";

export default function Treatments() {
  return (
    <section id="treatments" className="section bg-gradient-to-b from-brand-surface/50 to-white">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Premium Treatments
            </span>
          </span>
          <h2 className="mt-6">
            Clinically Designed for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
              Visible Transformation
            </span>
          </h2>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto">
            Every treatment at IA Skin Care is tailored to your unique skin type and goals — 
            backed by safe, doctor-supervised protocols and premium clinical-grade products.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:gap-10 md:grid-cols-2">
          {treatments.map((t, index) => (
            <article
              key={t.slug}
              className="group relative flex flex-col overflow-hidden rounded-[32px] border border-brand-border/60 bg-white shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all duration-500 animate-fadeUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Visual with premium styling */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-brand-surface to-white">
                <Image
                  src={t.image}
                  alt={t.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Premium gradient overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-brand-ink/20 via-transparent to-transparent"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-transparent to-brand-accent/10"
                />
                {t.badge && (
                  <span className="absolute top-5 left-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-brand-border/50 shadow-glass">
                    {t.badge}
                  </span>
                )}
                <span className="absolute top-5 right-5 text-[11px] font-semibold text-brand-ink bg-white/95 backdrop-blur-md px-3 py-2 rounded-full border border-brand-border/50 shadow-glass">
                  {t.duration}
                </span>
              </div>

              {/* Premium content styling */}
              <div className="flex-1 flex flex-col p-7 md:p-8">
                <p className="text-xs uppercase tracking-[0.18em] text-brand-accent font-semibold">
                  {t.tagline}
                </p>
                <h3 className="mt-3 text-2xl md:text-[26px] text-brand-ink leading-tight">
                  {t.title}
                </h3>
                <p className="mt-3 text-base text-brand-muted leading-relaxed">{t.description}</p>

                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {t.benefits.slice(0, 6).map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm text-brand-ink/90"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between border-t border-brand-border/80 pt-6">
                  <div>
                    <p className="text-3xl md:text-4xl font-semibold text-brand-primary leading-none">
                      {t.priceLabel}
                    </p>
                    <p className="text-sm text-brand-muted mt-1.5">
                      {t.unit} · {t.sessions}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <BookNowButton
                    treatmentSlug={t.slug}
                    className="w-full justify-center shadow-soft hover:shadow-card transition-shadow"
                  >
                    Book Now
                  </BookNowButton>
                  <Link
                    href={`/treatments/${t.slug}`}
                    className="btn-secondary w-full justify-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
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
