import BookNowButton from "@/components/booking/BookNowButton";
import { getPublicContactSettings } from "@/lib/data/public";

export default async function FinalCTA() {
  const contactSettings = await getPublicContactSettings();
  return (
    <section id="contact" className="section">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted text-white p-8 md:p-14 shadow-card">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-light/20 blur-3xl"
          />

          <div className="relative grid gap-10 md:grid-cols-12 items-center">
            <div className="md:col-span-7">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Ready when you are
              </span>
              <h2 className="mt-4 text-white">
                Begin your skincare journey with KIA Skin Care.
              </h2>
              <p className="mt-4 text-white/85 max-w-xl">
                Personalised treatments, doctor-supervised protocols, and a
                premium clinic experience designed around your skin goals.
              </p>
            </div>

            <div className="md:col-span-5 flex flex-col gap-3">
              <BookNowButton
                variant="secondary"
                className="bg-white text-brand-ink border-transparent hover:text-brand-muted hover:bg-white justify-center"
              >
                Book Consultation
              </BookNowButton>
              <a
                href={`tel:${contactSettings.phoneRaw}`}
                className="inline-flex justify-center rounded-full border border-white/40 text-white px-5 py-3 text-sm font-medium hover:bg-white/10 transition"
              >
                Call {contactSettings.phone}
              </a>
              <a
                href={contactSettings.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm text-white/80 hover:text-white"
              >
                or chat on WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
