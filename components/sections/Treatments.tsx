import Image from "next/image";
import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";
import { treatments } from "@/lib/site";

export default function Treatments() {
  return (
    <section id="treatments" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Signature Treatments</span>
          <h2 className="mt-3">Clinically designed for visible results</h2>
          <p className="mt-4">
            Every treatment at IA Skin Care is tailored to your skin type and
            goals — backed by safe, doctor-supervised protocols and premium
            clinical-grade products.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {treatments.map((t) => (
            <article
              key={t.slug}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-brand-border bg-white shadow-soft hover:shadow-card hover:-translate-y-0.5 transition"
            >
              {/* Visual — real image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-surface">
                <Image
                  src={t.image}
                  alt={t.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Subtle bottom gradient for legibility of badges */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-brand-ink/25 via-transparent to-transparent"
                />
                {t.badge && (
                  <span className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border border-brand-border shadow-soft">
                    {t.badge}
                  </span>
                )}
                <span className="absolute top-4 right-4 text-[10px] font-semibold text-brand-ink bg-white/95 backdrop-blur px-2.5 py-1 rounded-full border border-brand-border shadow-soft">
                  {t.duration}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col p-6 md:p-7">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-accent font-semibold">
                  {t.tagline}
                </p>
                <h3 className="mt-2 text-xl md:text-2xl text-brand-ink">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm md:text-[15px]">{t.description}</p>

                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {t.benefits.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-sm text-brand-ink/85"
                    >
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-5">
                  <div>
                    <p className="text-2xl md:text-3xl font-semibold text-brand-primary leading-none">
                      {t.priceLabel}
                    </p>
                    <p className="text-xs text-brand-muted mt-1">
                      {t.unit} · {t.sessions}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <BookNowButton
                    treatmentSlug={t.slug}
                    className="w-full justify-center"
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

        <p className="mt-8 text-center text-sm text-brand-muted">
          Unsure which treatment is right for you?{" "}
          <BookNowButton variant="ghost" className="!px-1 !py-0 align-baseline">
            Get a free consultation →
          </BookNowButton>
        </p>
      </div>
    </section>
  );
}
