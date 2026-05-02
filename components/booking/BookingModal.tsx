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
    // TODO: Replace with real API / Supabase insert + Razorpay/Cashfree integration
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
        className="absolute inset-0 bg-brand-ink/50 backdrop-blur-sm animate-fadeUp"
      />
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-card animate-fadeUp"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-brand-border px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-accent">
              Secure Booking
            </p>
            <h3 id="booking-title" className="mt-0.5 text-lg sm:text-xl font-semibold text-brand-ink">
              Book Your Consultation
            </h3>
          </div>
          <button
            aria-label="Close"
            onClick={close}
            className="h-9 w-9 rounded-full border border-brand-border text-brand-ink hover:bg-brand-surface"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-6 grid gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input
                type="text"
                value={form.fullName}
                onChange={update("fullName")}
                placeholder="Your name"
                className="input"
                autoComplete="name"
              />
            </Field>
            <Field label="Mobile Number *">
              <input
                type="tel"
                value={form.mobile}
                onChange={update("mobile")}
                placeholder="+91 9XXXXXXXXX"
                className="input"
                autoComplete="tel"
              />
            </Field>
          </div>

          <Field label="Email (optional)">
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
            />
          </Field>

          <Field label="Select Treatment *">
            <select value={form.treatment} onChange={update("treatment")} className="input">
              <option value="">Choose a treatment…</option>
              {treatments.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title} — {t.priceLabel}
                </option>
              ))}
              <option value="general-consultation">General Consultation</option>
            </select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Preferred Date *">
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={update("date")}
                className="input"
              />
            </Field>
            <Field label="Preferred Time *">
              <select value={form.time} onChange={update("time")} className="input">
                <option value="">Select time…</option>
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
            </Field>
          </div>

          <Field label="Referral Code (optional)">
            <input
              type="text"
              value={form.referralCode}
              onChange={update("referralCode")}
              placeholder="Enter if you have one"
              className="input uppercase"
            />
          </Field>

          <Field label="Message (optional)">
            <textarea
              value={form.message}
              onChange={update("message")}
              rows={3}
              placeholder="Tell us about your skin concerns…"
              className="input resize-none"
            />
          </Field>

          {/* Price summary */}
          {selected && (
            <div className="rounded-2xl bg-brand-surface border border-brand-border p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-muted">Estimated amount</p>
                <p className="text-lg font-semibold text-brand-ink">
                  {selected.priceLabel}{" "}
                  <span className="text-xs font-normal text-brand-muted">
                    {selected.unit}
                  </span>
                </p>
              </div>
              <span className="text-[11px] font-medium text-brand-accent bg-brand-accent/10 px-3 py-1.5 rounded-full">
                Payment link sent after confirmation
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <p className="text-xs text-brand-muted">
            By submitting, you agree to be contacted on WhatsApp/phone to
            confirm your slot. Need help? Call our customer care at{" "}
            <a
              href={`tel:${site.phoneRaw}`}
              className="font-semibold text-brand-ink hover:text-brand-accent"
            >
              {site.phone}
            </a>
            . Online payment via Razorpay / Cashfree —{" "}
            <span className="font-medium text-brand-ink">coming soon.</span>
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
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
              className="btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Confirm Booking"}
            </button>
          </div>

          <p className="text-center text-xs text-brand-muted pt-1">
            Prefer chat?{" "}
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent font-medium hover:underline"
            >
              Book on WhatsApp →
            </a>
          </p>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #E3EDF2;
          background: #fff;
          padding: 12px 14px;
          font-size: 14px;
          color: #0B2030;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: #1BA3C6;
          box-shadow: 0 0 0 4px rgba(27, 163, 198, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-brand-ink mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
