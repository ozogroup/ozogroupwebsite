import Link from "next/link";
import { getPublicContactSettings, getPublicSiteContent } from "@/lib/data/public";

export default async function ContactCTA() {
  const [contactSettings, siteContent] = await Promise.all([
    getPublicContactSettings(),
    getPublicSiteContent("contact_cta"),
  ]);
  const eyebrow = siteContent.contact_cta_eyebrow || "Get In Touch";
  const heading = siteContent.contact_cta_heading || "Ready to start your skincare journey?";
  const description =
    siteContent.contact_cta_description ||
    "Talk to our experts and get a personalised treatment plan crafted just for your skin goals.";
  return (
    <section id="contact" className="section">
      <div className="container-x">
        <div className="rounded-3xl border border-brand-border bg-white shadow-card p-8 md:p-12 grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="eyebrow">{eyebrow}</span>
            <h2 className="mt-3">{heading}</h2>
            <p className="mt-3">
              {description}
            </p>
          </div>
          <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-3 md:items-stretch">
            <a href={`tel:${contactSettings.phoneRaw}`} className="btn-primary justify-center">
              Call {contactSettings.phone}
            </a>
            <a
              href={contactSettings.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary justify-center"
            >
              Chat on WhatsApp
            </a>
            <Link href="#get-started" className="btn-ghost justify-center">
              Become a Member →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
