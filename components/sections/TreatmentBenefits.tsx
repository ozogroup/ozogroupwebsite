import Image from "next/image";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import AutoSlider from "@/components/ui/AutoSlider";
import { getPublicSiteContent } from "@/lib/data/public";

type BenefitSlide = {
  key: string;
  src?: string;
  alt: string;
};

export default async function TreatmentBenefits() {
  const content = await getPublicSiteContent("treatment_benefits");
  const slides: BenefitSlide[] = [
    {
      key: "poster-1",
      src: content.poster_image_1 || "/treatment-benefits/treatment-benefit-01.jpeg",
      alt: "Skin glow kit treatment benefits",
    },
    {
      key: "poster-2",
      src: content.poster_image_2 || "/treatment-benefits/treatment-benefit-02.jpeg",
      alt: "Basic skin care kit treatment benefits",
    },
    {
      key: "poster-3",
      src: content.poster_image_3 || undefined,
      alt: "Treatment benefit poster slot three",
    },
    {
      key: "poster-4",
      src: content.poster_image_4 || undefined,
      alt: "Treatment benefit poster slot four",
    },
    {
      key: "franchise-opportunity",
      src: "/images/client-approved/franchise-opportunity.jpeg",
      alt: "KIA Skin Care franchise opportunity with premium products and training support",
    },
  ];

  return (
    <section
      id="treatment-benefits"
      className="section relative overflow-hidden bg-gradient-to-b from-white via-brand-surface/70 to-white scroll-mt-24"
    >
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-white px-4 py-2 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
              {content.benefits_eyebrow || "Visible Care Results"}
            </span>
          </div>
          <h2 className="mt-6">{content.benefits_heading || "Treatment Benefits"}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-muted">
            {content.benefits_description ||
              "Explore the visible benefits and care-focused results of our professional skincare treatments."}
          </p>
        </div>

        <div className="mt-12">
          <AutoSlider
            ariaLabel="Treatment benefits"
            tabletItems={2}
            desktopItems={3}
            itemClassName="basis-full md:basis-[calc((100%_-_1.25rem)/2)] lg:basis-[calc((100%_-_2.5rem)/3)]"
          >
            {slides.map((slide, index) => (
              <article
                key={slide.key}
                className="group h-full overflow-hidden rounded-2xl border border-brand-border/80 bg-[#F8F4EC] p-3 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-accent/30 hover:shadow-premium"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#F8F4EC]">
                  {slide.src ? (
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      sizes="(max-width: 767px) 92vw, (max-width: 1023px) 44vw, 30vw"
                      className="object-contain transition duration-300 group-hover:scale-[1.01]"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center border border-dashed border-brand-accent/35 bg-gradient-to-br from-[#F8F4EC] to-[#EDE5D8] px-8 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-accent shadow-soft">
                        <ImagePlus className="h-6 w-6" />
                      </span>
                      <p className="mt-5 text-base font-semibold text-brand-ink">New treatment poster coming soon</p>
                      <p className="mt-2 text-sm text-brand-muted">This slot is ready for the next approved visual.</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </AutoSlider>
        </div>

        <div className="mt-10 text-center">
          <Link href="#treatments" className="btn-primary justify-center shadow-soft hover:shadow-card">
            Book Your Treatment
          </Link>
        </div>
      </div>
    </section>
  );
}
