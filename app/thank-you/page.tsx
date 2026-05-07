import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = {
  title: "Booking Received · IA Skin Care",
  description: "Thank you! Your booking request has been received.",
};

export default function ThankYouPage() {
  return (
    <section className="section">
      <div className="container-x max-w-2xl text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <span className="eyebrow mt-6 justify-center">Booking Received</span>
        <h1 className="mt-3">Thank you. Our team will contact you shortly.</h1>
        <p className="mt-4 max-w-lg mx-auto">
          Our team will call or WhatsApp you shortly on{" "}
          <span className="font-semibold text-brand-ink">{site.phone}</span> to
          confirm your slot. Online payment via Razorpay / Cashfree is coming
          soon — for now we'll share a secure payment link after confirmation.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Chat on WhatsApp
          </a>
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
