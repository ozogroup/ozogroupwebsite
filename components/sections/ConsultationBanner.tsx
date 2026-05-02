import BookNowButton from "@/components/booking/BookNowButton";
import { site } from "@/lib/site";

export default function ConsultationBanner() {
  return (
    <section className="py-10 md:py-14">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-white shadow-soft p-6 md:p-10 grid gap-6 md:grid-cols-12 items-center">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-accent/15 blur-2xl"
          />
          <div className="relative md:col-span-8">
            <span className="eyebrow">Free First Consultation</span>
            <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-brand-ink">
              Talk to our skincare expert — crafted for your skin type.
            </h3>
            <p className="mt-2 text-sm md:text-base text-brand-muted max-w-xl">
              Share your concerns and get a personalised treatment plan. No
              pressure, no upselling — only what's right for your skin.
            </p>
          </div>
          <div className="relative md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3">
            <BookNowButton className="w-full justify-center">
              Book Consultation
            </BookNowButton>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full justify-center"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
