import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { treatments, site } from "@/lib/site";
import BookNowButton from "@/components/booking/BookNowButton";

type Params = { params: { slug: string } };

export function generateStaticParams() {
  return treatments.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const t = treatments.find((x) => x.slug === params.slug);
  if (!t) return { title: "Treatment not found · IA Skin Care" };
  return {
    title: `${t.title} · IA Skin Care`,
    description: t.description,
    openGraph: {
      title: `${t.title} · IA Skin Care`,
      description: t.description,
      images: [t.image],
    },
  };
}

export default function TreatmentDetail({ params }: Params) {
  const t = treatments.find((x) => x.slug === params.slug);
  if (!t) notFound();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 55% at 85% 0%, rgba(27,163,198,0.18) 0%, rgba(255,255,255,0) 60%), radial-gradient(45% 55% at 0% 15%, rgba(93,169,214,0.16) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
        <div className="container-x pt-10 md:pt-14 pb-12 md:pb-16 grid gap-10 lg:gap-14 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 animate-fadeUp">
            <Link
              href="/#treatments"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-accent"
            >
              <span aria-hidden>←</span> All Treatments
            </Link>
            <span className="eyebrow mt-5">{t.tagline}</span>
            <h1 className="mt-3">{t.title}</h1>
            <p className="mt-4 text-lg max-w-xl">{t.description}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-semibold text-brand-primary">
                {t.priceLabel}
              </span>
              <span className="text-sm text-brand-muted">
                {t.unit} · {t.duration} · {t.sessions}
              </span>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <BookNowButton treatmentSlug={t.slug} className="justify-center">
                Book Now
              </BookNowButton>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary justify-center"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Image */}
          <div className="lg:col-span-6 animate-fadeUp">
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none rounded-[28px] overflow-hidden border border-brand-border shadow-card">
              <Image
                src={t.image}
                alt={t.imageAlt}
                fill
                sizes="(max-width: 1024px) 90vw, 600px"
                priority
                className="object-cover"
              />
              {t.badge && (
                <span className="absolute top-4 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border border-brand-border shadow-soft">
                  {t.badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW + BENEFITS */}
      <section className="section bg-brand-surface">
        <div className="container-x grid gap-10 lg:gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="eyebrow">Overview</span>
            <h2 className="mt-3">A premium clinical protocol</h2>
            <p className="mt-4">{t.overview}</p>
            <div className="mt-6 rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.16em] font-semibold text-brand-accent">
                Safety
              </p>
              <p className="mt-2 text-sm text-brand-ink/85">{t.safety}</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <span className="eyebrow">Key Benefits</span>
            <h3 className="mt-3 text-2xl">What you'll experience</h3>
            <ul className="mt-5 grid sm:grid-cols-2 gap-3">
              {t.benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-2xl bg-white border border-brand-border p-4 shadow-soft"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-sm text-brand-ink/90">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">The Process</span>
            <h2 className="mt-3">Step-by-step, doctor-supervised</h2>
            <p className="mt-3">
              Every session is delivered by trained skincare experts using
              clinical-grade products.
            </p>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {t.process.map((p, i) => (
              <li
                key={p.step}
                className="card hover:-translate-y-0.5 transition-transform"
              >
                <span className="text-xs font-semibold tracking-[0.22em] text-brand-accent">
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg">{p.step}</h3>
                <p className="mt-2 text-sm">{p.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section className="section bg-brand-surface">
        <div className="container-x grid gap-10 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5">
            <span className="eyebrow">Who It's For</span>
            <h2 className="mt-3">Built for real skin concerns</h2>
            <p className="mt-3">
              Not sure if it's right for you? Our experts will help during your
              free consultation.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <BookNowButton treatmentSlug={t.slug}>Book Consultation</BookNowButton>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
          <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {t.whoFor.map((w) => (
              <li
                key={w}
                className="flex items-start gap-3 rounded-2xl bg-white border border-brand-border p-4 shadow-soft"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2 5 5 .5-3.5 3.5L17 16l-5-2.5L7 16l1.5-5L5 7.5 10 7z" />
                  </svg>
                </span>
                <span className="text-sm text-brand-ink/90">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-3">Common questions</h2>
            <p className="mt-3">
              Still unsure? Reach out on WhatsApp — we usually respond within
              minutes.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="divide-y divide-brand-border rounded-2xl border border-brand-border bg-white shadow-soft overflow-hidden">
              {t.faqs.map((f, i) => (
                <details key={f.q} className="group" open={i === 0}>
                  <summary className="flex items-center justify-between gap-4 cursor-pointer px-5 md:px-6 py-4 md:py-5 list-none select-none">
                    <span className="text-sm md:text-base font-semibold text-brand-ink">
                      {f.q}
                    </span>
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent transition group-open:rotate-45">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 md:px-6 pb-5 md:pb-6 -mt-1 text-sm text-brand-muted leading-relaxed">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent text-white p-8 md:p-12 shadow-card">
            <div
              aria-hidden
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            <div className="relative grid gap-8 md:grid-cols-12 items-center">
              <div className="md:col-span-7">
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Ready when you are
                </span>
                <h2 className="mt-3 text-white">
                  Book your {t.title} session today.
                </h2>
                <p className="mt-3 text-white/90 max-w-xl">
                  {t.priceLabel} {t.unit}. Online slots fill fast — secure yours
                  in under a minute.
                </p>
              </div>
              <div className="md:col-span-5 flex flex-col gap-3">
                <BookNowButton
                  treatmentSlug={t.slug}
                  variant="secondary"
                  className="bg-white text-brand-primary border-transparent hover:text-brand-accent hover:bg-white justify-center"
                >
                  Book Now · {t.priceLabel}
                </BookNowButton>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-full border border-white/40 text-white px-5 py-3 text-sm font-medium hover:bg-white/10 transition"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href={`tel:${site.phoneRaw}`}
                  className="text-center text-sm text-white/85 hover:text-white"
                >
                  or call {site.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
