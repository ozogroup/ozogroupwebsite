import Image from "next/image";
import Link from "next/link";
import AutoSlider from "@/components/ui/AutoSlider";

const benefitImages = [
  {
    src: "/treatment-benefits/treatment-benefit-01.jpeg",
    width: 1080,
    height: 1276,
    alt: "Aedvanch Skin Glow Kit benefits for natural glow, cleansing, hydration, dead skin removal and moisturising protection",
  },
  {
    src: "/treatment-benefits/treatment-benefit-02.jpeg",
    width: 1080,
    height: 1284,
    alt: "Basic skin care kit benefits and usage steps for brightening facewash, moisturising lotion, night repair and sunscreen",
  },
  {
    src: "/treatment-benefits/treatment-benefit-03.jpeg",
    width: 1080,
    height: 1600,
    alt: "Korean Glass Skin care kit benefits including hydration, glow, tone correction, barrier support and overnight repair",
  },
  {
    src: "/treatment-benefits/treatment-benefit-04.jpeg",
    width: 1080,
    height: 1284,
    alt: "Japanese skin care kit benefits and daily routine for cleansing, hydration, glow, anti-aging and sun protection",
  },
  {
    src: "/images/client-approved/franchise-opportunity.jpeg",
    width: 1352,
    height: 1600,
    alt: "KIA Skin Care franchise opportunity with premium products, training and marketing support",
  },
];

export default function TreatmentBenefits() {
  return (
    <section
      id="treatment-benefits"
      className="section relative overflow-hidden bg-gradient-to-b from-white via-brand-surface/70 to-white scroll-mt-24"
    >
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-accent/20 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Visible Care Results
            </span>
          </div>
          <h2 className="mt-6">Treatment Benefits</h2>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Explore the visible benefits and care-focused results of our professional skincare treatments.
          </p>
        </div>

        <div className="mt-12">
          <AutoSlider
            ariaLabel="Treatment benefits"
            tabletItems={2}
            desktopItems={3}
            itemClassName="basis-full md:basis-[calc((100%_-_1.25rem)/2)] lg:basis-[calc((100%_-_2.5rem)/3)]"
          >
            {benefitImages.map((image, index) => (
              <article
                key={image.src}
                className="group h-full overflow-hidden rounded-2xl border border-brand-border/80 bg-white p-3 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-accent/30 hover:shadow-premium"
              >
                <div className="relative h-[min(85vw,21rem)] overflow-hidden rounded-xl bg-gradient-to-br from-brand-surface to-white md:h-auto md:aspect-[3/4]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 767px) 92vw, (max-width: 1023px) 44vw, 30vw"
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                    priority={index < 2}
                  />
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
