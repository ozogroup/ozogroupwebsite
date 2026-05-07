"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "./BookingContext";
import { treatments, site } from "@/lib/site";

type FormState = {
  fullName: string;
  mobile: string;
  email: string;
  treatment: string;
  date: string;
  time: string;
  referralCode: string;
  message: string;
};

const initial: FormState = {
  fullName: "",
  mobile: "",
  email: "",
  treatment: "",
  date: "",
  time: "",
  referralCode: "",
  message: "",
};

export default function BookingModal() {
  const { isOpen, treatmentSlug, close } = useBooking();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && treatmentSlug) {
      setForm((f) => ({ ...f, treatment: treatmentSlug }));
    }
    if (!isOpen) {
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, treatmentSlug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const update =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) return setError("Please enter your full name.");
    if (!/^[0-9+\-\s]{10,15}$/.test(form.mobile.trim()))
      return setError("Please enter a valid mobile number.");
    if (!form.treatment) return setError("Please select a treatment.");
    if (!form.date) return setError("Please pick a preferred date.");
    if (!form.time) return setError("Please pick a preferred time.");

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));

    try {
      sessionStorage.setItem(
        "ia_last_booking",
        JSON.stringify({ ...form, submittedAt: new Date().toISOString() })
      );
    } catch {}

    setSubmitting(false);
    setForm(initial);
    close();
    router.push("/thank-you");
  }

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];
  const selected = treatments.find((t) => t.slug === form.treatment);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <button
        aria-label="Close booking form"
        onClick={close}
        className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm animate-fadeUp"
      />
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-t-[32px] sm:rounded-[32px] shadow-premium animate-scaleIn"
      >
        {/* Premium Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-brand-border/60 px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-brand-accent">
                Secure Booking
              </p>
            </div>
            <h3 id="booking-title" className="mt-2 text-xl sm:text-2xl font-semibold text-brand-ink">
              Book Your Consultation
            </h3>
          </div>
          <button
            aria-label="Close"
            onClick={close}
            className="h-10 w-10 rounded-full border border-brand-border/60 text-brand-ink hover:bg-brand-surface flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 grid gap-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <FloatingLabel label="Full Name" required>
              <input
                type="text"
                value={form.fullName}
                onChange={update("fullName")}
                placeholder=" "
                className="premium-input"
                autoComplete="name"
              />
            </FloatingLabel>
            <FloatingLabel label="Mobile Number" required>
              <input
                type="tel"
                value={form.mobile}
                onChange={update("mobile")}
                placeholder=" "
                className="premium-input"
                autoComplete="tel"
              />
            </FloatingLabel>
          </div>

          <FloatingLabel label="Email Address">
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder=" "
              className="premium-input"
              autoComplete="email"
            />
          </FloatingLabel>

          <FloatingLabel label="Select Treatment" required>
            <select value={form.treatment} onChange={update("treatment")} className="premium-input">
              <option value="">Choose a treatment</option>
              {treatments.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title} — {t.priceLabel}
                </option>
              ))}
              <option value="general-consultation">General Consultation</option>
            </select>
          </FloatingLabel>

          <div className="grid sm:grid-cols-2 gap-5">
            <FloatingLabel label="Preferred Date" required>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={update("date")}
                className="premium-input"
              />
            </FloatingLabel>
            <FloatingLabel label="Preferred Time" required>
              <select value={form.time} onChange={update("time")} className="premium-input">
                <option value="">Select time</option>
                {[
                  "10:00 AM",
                  "11:30 AM",
                  "1:00 PM",
                  "3:00 PM",
                  "4:30 PM",
                  "6:00 PM",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FloatingLabel>
          </div>

          <FloatingLabel label="Referral Code">
            <input
              type="text"
              value={form.referralCode}
              onChange={update("referralCode")}
              placeholder=" "
              className="premium-input uppercase"
            />
          </FloatingLabel>

          <FloatingLabel label="Your Message">
            <textarea
              value={form.message}
              onChange={update("message")}
              rows={3}
              placeholder="Tell us about your skin concerns..."
              className="premium-input resize-none"
            />
          </FloatingLabel>

          {/* Premium Price Summary */}
          {selected && (
            <div className="rounded-2xl bg-gradient-to-r from-brand-surface to-white border border-brand-border/80 p-5 flex items-center justify-between shadow-soft">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] font-semibold text-brand-muted mb-1">
                  Estimated Amount
                </p>
                <p className="text-2xl font-bold text-brand-primary">
                  {selected.priceLabel}{" "}
                  <span className="text-sm font-normal text-brand-muted">
                    {selected.unit}
                  </span>
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-4 py-2 rounded-full">
                Payment link sent after confirmation
              </span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <p className="text-sm text-brand-muted leading-relaxed">
            By submitting, you agree to be contacted on WhatsApp/phone to confirm your slot. 
            Need help? Call our customer care at{" "}
            <a
              href={`tel:${site.phoneRaw}`}
              className="font-semibold text-brand-ink hover:text-brand-accent transition-colors"
            >
              {site.phone}
            </a>
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end pt-2">
            <button
              type="button"
              onClick={close}
              className="btn-secondary justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-soft hover:shadow-card transition-shadow"
            >
              {submitting ? "Submitting..." : "Confirm Booking"}
            </button>
          </div>

          <p className="text-center text-sm text-brand-muted pt-2">
            Prefer chat?{" "}
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent font-semibold hover:underline"
            >
              Book on WhatsApp →
            </a>
          </p>
        </form>
      </div>

      <style jsx>{`
        .premium-input {
          width: 100%;
          border-radius: 16px;
          border: 2px solid #E3EDF2;
          background: #fff;
          padding: 16px 18px;
          font-size: 15px;
          color: #0B2030;
          outline: none;
          transition: all 0.2s ease;
        }
        .premium-input:focus {
          border-color: #1BA3C6;
          box-shadow: 0 0 0 4px rgba(27, 163, 198, 0.12);
        }
        .premium-input::placeholder {
          color: transparent;
        }
        .premium-input:not(:placeholder-shown) + label,
        .premium-input:focus + label {
          transform: translateY(-28px) scale(0.85);
          color: #1BA3C6;
        }
      `}</style>
    </div>
  );
}

function FloatingLabel({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="relative block">
      {children}
      <span className="absolute left-4 top-4 text-sm text-brand-muted transition-all duration-200 pointer-events-none origin-[0]">
        {label}
        {required && <span className="text-brand-accent ml-1">*</span>}
      </span>
    </label>
  );
}
