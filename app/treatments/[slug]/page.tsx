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
              "radial-gradient(ellipse at 80% 0%, rgba(27,163,198,0.15) 0%, rgba(255,255,255,0) 50%), radial-gradient(ellipse at 20% 100%, rgba(93,169,214,0.12) 0%, rgba(255,255,255,0) 50%), linear-gradient(180deg, rgba(245,250,252,0.5) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div className="container-x pt-12 md:pt-16 pb-14 md:pb-18 grid gap-10 lg:gap-14 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 animate-fadeUp">
            <Link
              href="/#treatments"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All Treatments
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20 mt-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                {t.tagline}
              </span>
            </div>
            <h1 className="mt-6">{t.title}</h1>
            <p className="mt-5 text-lg text-brand-muted max-w-xl leading-relaxed">{t.description}</p>

            <div className="mt-8 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-semibold text-brand-primary">
                {t.priceLabel}
              </span>
              <span className="text-sm text-brand-muted">
                {t.unit} · {t.duration} · {t.sessions}
              </span>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {t.treatmentType === "home-kit" ? (
                <BookNowButton treatmentSlug={t.slug} className="justify-center shadow-soft hover:shadow-card transition-shadow">
                  Book Home Kit Program
                </BookNowButton>
              ) : (
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  Book Consultation
                </a>
              )}
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

          {/* Image with glassmorphism */}
          <div className="lg:col-span-6 animate-fadeUp" style={{ animationDelay: "0.15s" }}>
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none rounded-[32px] overflow-hidden border border-brand-border/60 shadow-premium bg-gradient-to-br from-brand-surface to-white">
              <Image
                src={t.image}
                alt={t.imageAlt}
                fill
                sizes="(max-width: 1024px) 90vw, 600px"
                priority
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
              {t.badge && (
                <span className="absolute top-5 left-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-brand-border/50 shadow-glass">
                  {t.badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW + BENEFITS */}
      <section className="section bg-brand-surface/50">
        <div className="container-x grid gap-12 lg:gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Overview
              </span>
            </div>
            <h2 className="mt-6">A Premium Clinical Protocol</h2>
            <p className="mt-4 text-base text-brand-muted leading-relaxed">{t.overview}</p>
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-surface to-white border border-brand-border/80 p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-accent to-brand-light flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-brand-accent">
                  Safety Information
                </p>
              </div>
              <p className="text-sm text-brand-ink/90 leading-relaxed">{t.safety}</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Key Benefits
              </span>
            </div>
            <h3 className="mt-6 text-2xl">What You'll Experience</h3>
            <ul className="mt-6 grid sm:grid-cols-2 gap-4">
              {t.benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-2xl bg-white border border-brand-border/60 p-5 shadow-soft hover:shadow-card transition-shadow"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                The Process
              </span>
            </div>
            <h2 className="mt-6">Step-by-Step, Doctor-Supervised</h2>
            <p className="mt-4 text-base text-brand-muted">
              Every session is delivered by trained skincare experts using clinical-grade products.
            </p>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {t.process.map((p, i) => (
              <li
                key={p.step}
                className="card hover:-translate-y-1 transition-transform duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-brand-accent">
                  <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-accent to-brand-light flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  STEP
                </span>
                <h3 className="mt-4 text-lg text-brand-ink">{p.step}</h3>
                <p className="mt-2 text-sm text-brand-muted leading-relaxed">{p.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section className="section bg-brand-surface/50">
        <div className="container-x grid gap-12 lg:gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Who It's For
              </span>
            </div>
            <h2 className="mt-6">Built for Real Skin Concerns</h2>
            <p className="mt-4 text-base text-brand-muted leading-relaxed">
              Not sure if it's right for you? Our experts will help during your free consultation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {t.treatmentType === "home-kit" ? (
                <BookNowButton treatmentSlug={t.slug}>Book Home Kit Program</BookNowButton>
              ) : (
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Book Consultation
                </a>
              )}
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
          <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {t.whoFor.map((w) => (
              <li
                key={w}
                className="flex items-start gap-3 rounded-2xl bg-white border border-brand-border/60 p-5 shadow-soft hover:shadow-card transition-shadow"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-accent/15 text-brand-primary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2 5 5 .5-3.5 3.5L17 16l-5-2.5L7 16l1.5-5L5 7.5 10 7z" />
                  </svg>
                </span>
                <span className="text-sm text-brand-ink/90">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="section">
        <div className="container-x grid gap-12 lg:gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                FAQ
              </span>
            </div>
            <h2 className="mt-6">Common Questions</h2>
            <p className="mt-4 text-base text-brand-muted leading-relaxed">
              Still unsure? Reach out on WhatsApp — we usually respond within minutes.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="divide-y divide-brand-border/60 rounded-2xl border border-brand-border/60 bg-white shadow-soft overflow-hidden">
              {t.faqs.map((f, i) => (
                <details key={f.q} className="group" open={i === 0}>
                  <summary className="flex items-center justify-between gap-4 cursor-pointer px-6 md:px-7 py-5 md:py-6 list-none select-none hover:bg-brand-surface/50 transition-colors">
                    <span className="text-sm md:text-base font-semibold text-brand-ink">
                      {f.q}
                    </span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent transition group-open:rotate-45">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 md:px-7 pb-6 md:pb-7 -mt-1 text-sm text-brand-muted leading-relaxed">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Future-ready Campaign Info */}
      {t.treatmentType === "camp" && (
        <section className="section bg-gradient-to-b from-white to-brand-surface/50">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Upcoming Events
                </span>
              </div>
              <h2 className="mt-6">Campaign & Event Schedule</h2>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                Register your interest for upcoming glass skin treatment campaigns in your city.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  city: "Mumbai",
                  date: "Coming Soon",
                  slots: "Limited",
                  status: "Registration Open",
                },
                {
                  city: "Delhi",
                  date: "Coming Soon",
                  slots: "Limited",
                  status: "Registration Open",
                },
                {
                  city: "Bangalore",
                  date: "Coming Soon",
                  slots: "Limited",
                  status: "Registration Open",
                },
              ].map((event, i) => (
                <div
                  key={event.city}
                  className="card hover:-translate-y-1 transition-transform duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-brand-ink">{event.city}</h3>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                      {event.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-brand-muted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {event.date}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-brand-muted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {event.slots} slots
                    </div>
                  </div>
                  <button className="mt-6 w-full btn-secondary justify-center text-sm">
                    Register Interest
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Home Kit Delivery Info */}
      {t.treatmentType === "home-kit" && (
        <section className="section bg-gradient-to-b from-white to-brand-surface/50">
          <div className="container-x">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Home Delivery
                </span>
              </div>
              <h2 className="mt-6">Premium Home Treatment Kit</h2>
              <p className="mt-4 text-lg text-brand-muted leading-relaxed">
                Your complete treatment kit is delivered directly to your doorstep with all 
                premium clinical-grade products needed for the program.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  "Premium clinical-grade products",
                  "Detailed treatment instructions",
                  "Video consultation access",
                  "Weekly progress tracking",
                  "Ongoing support via WhatsApp",
                ].map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-brand-border/60"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-brand-ink">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent text-white p-8 md:p-14 shadow-premium">
            <div
              aria-hidden
              className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl"
            />
            <div className="relative grid gap-8 md:grid-cols-12 items-center">
              <div className="md:col-span-7">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-white/85">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Ready when you are
                </div>
                <h2 className="mt-4 text-white text-3xl md:text-4xl">
                  Book Your {t.title} Session Today
                </h2>
                <p className="mt-4 text-white/90 text-base max-w-xl leading-relaxed">
                  {t.priceLabel} {t.unit}. Online slots fill fast — secure yours in under a minute.
                </p>
              </div>
              <div className="md:col-span-5 flex flex-col gap-4">
                <BookNowButton
                  treatmentSlug={t.slug}
                  variant="secondary"
                  className="bg-white text-brand-primary border-transparent hover:text-brand-accent hover:bg-white justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  Book Now · {t.priceLabel}
                </BookNowButton>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-full border border-white/40 text-white px-6 py-3.5 text-sm font-medium hover:bg-white/10 transition backdrop-blur-sm"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href={`tel:${site.phoneRaw}`}
                  className="text-center text-sm text-white/85 hover:text-white transition-colors"
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
