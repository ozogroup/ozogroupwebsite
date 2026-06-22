import Link from "next/link";
import BookNowButton from "@/components/booking/BookNowButton";
import AutoSlider from "@/components/ui/AutoSlider";
import TreatmentGallery from "@/components/ui/TreatmentGallery";
import { getPublicSiteContent, getPublicTreatments } from "@/lib/data/public";
import { getOfferingCtaLabel, getOfferingTypeLabel } from "@/lib/treatment-labels";

export default async function Treatments() {
  const [treatments, siteContent] = await Promise.all([
    getPublicTreatments(),
    getPublicSiteContent("home_treatment"),
  ]);
  const heading = siteContent.treatment_heading || siteContent.heading || "Advanced Skincare Solutions";
  const subtitle =
    siteContent.treatment_description ||
    siteContent.treatment_subtitle ||
    siteContent.subtitle ||
    "Choose between premium home treatment programs or exclusive clinical experiences designed for visible, lasting results.";

  return (
    <section id="treatments" className="scroll-mt-24 py-8 md:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-gradient-to-r from-brand-accent/10 to-brand-light/10 px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
              Premium Treatments
            </span>
          </div>
          <h2 className="mt-4">{heading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">
            {subtitle}
          </p>
        </div>

        <div className="mt-8">
          <AutoSlider
            ariaLabel="KIA Skin Care treatments"
            tabletItems={2}
            desktopItems={3}
            intervalMs={3400}
            itemClassName="basis-[84%] sm:basis-[calc((100%_-_1.25rem)/2)] lg:basis-[calc((100%_-_2.5rem)/3)]"
          >
            {treatments.map((treatment, index) => (
              <article
                key={treatment.slug}
                className="flex h-full flex-col rounded-2xl border border-brand-border bg-white p-3 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TreatmentGallery
                  images={(treatment as any).gallery?.length ? (treatment as any).gallery : [treatment.image]}
                  alt={treatment.imageAlt}
                  compact
                />

                <div className="mt-4 flex flex-1 flex-col px-1 pb-1">
                  <p className="mb-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
                    {getOfferingTypeLabel(treatment.treatmentType)} · {treatment.tagline}
                  </p>
                  <h3 className="mb-1.5 truncate text-lg font-semibold text-brand-ink">
                    {treatment.title}
                  </h3>
                  <p className="mb-4 line-clamp-1 text-sm text-brand-muted">
                    {treatment.description}
                  </p>

                  <div className="mt-auto border-t border-brand-border/60 pt-3">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <p className="text-xl font-bold text-brand-primary">{treatment.priceLabel}</p>
                      <span className="text-xs text-brand-muted">{treatment.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <BookNowButton
                        treatmentSlug={treatment.slug}
                        className="min-w-0 justify-center px-3 py-2.5 text-xs"
                      >
                        {getOfferingCtaLabel(treatment.treatmentType)}
                      </BookNowButton>
                      <Link
                        href={`/treatments/${treatment.slug}`}
                        className="btn-secondary min-w-0 justify-center px-3 py-2.5 text-xs"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </AutoSlider>
        </div>

      </div>
    </section>
  );
}
