"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/actions/bookings";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { site } from "@/lib/site";
import { treatmentKitCatalog, treatmentKitSlugs } from "@/lib/treatments/catalog";
import { useBooking } from "./BookingContext";

type FormState = {
  fullName: string;
  mobile: string;
  email: string;
  treatment: string;
  city: string;
  address: string;
  pinCode: string;
  referralCode: string;
  message: string;
};

type TreatmentOption = {
  slug: string;
  title: string;
  kitName?: string;
  price: number;
  priceLabel: string;
  unit?: string;
  treatmentType?: string;
  note?: string;
};

const initial: FormState = {
  fullName: "",
  mobile: "",
  email: "",
  treatment: "",
  city: "",
  address: "",
  pinCode: "",
  referralCode: "",
  message: "",
};

const defaultBookingTreatments: TreatmentOption[] = treatmentKitCatalog.map((treatment) => ({
  slug: treatment.slug,
  title: treatment.title,
  kitName: treatment.kitName,
  price: treatment.price,
  priceLabel: treatment.priceLabel,
  unit: treatment.unit,
  treatmentType: treatment.treatmentType,
  note: treatment.note,
}));

export default function BookingModal() {
  const { isOpen, treatmentSlug, close } = useBooking();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [availableTreatments, setAvailableTreatments] =
    useState<TreatmentOption[]>(defaultBookingTreatments);
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

  useEffect(() => {
    if (!isOpen) return;

    const urlCode = new URLSearchParams(window.location.search).get("ref");
    const storedCode = localStorage.getItem("ozo_referral_code");
    if (urlCode) localStorage.setItem("ozo_referral_code", urlCode.toUpperCase());
    setForm((f) => ({
      ...f,
      referralCode: (urlCode || storedCode || f.referralCode).toUpperCase(),
    }));

    async function loadTreatments() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("treatments" as any)
          .select("slug,title,kit_name,price,price_label,unit,treatment_type,cta_text")
          .eq("active", true)
          .is("deleted_at", null)
          .in("slug", treatmentKitSlugs as unknown as string[])
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setAvailableTreatments(
            data.map((t: any) => ({
              slug: t.slug,
              title: t.title,
              kitName: t.kit_name || t.title,
              price: Number(t.price || 0),
              priceLabel:
                t.price_label || `₹${Number(t.price || 0).toLocaleString("en-IN")}`,
              unit: t.unit || "",
              treatmentType: t.treatment_type || "",
              note: t.cta_text || "",
            }))
          );
        }
      } catch (e) {
        console.error("Unable to load treatments", e);
      }
    }

    loadTreatments();
  }, [isOpen]);

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
    if (!form.city.trim()) return setError("Please enter your city.");
    if (!form.address.trim()) return setError("Please enter your address.");
    if (!form.pinCode.trim()) return setError("Please enter your pin code.");

    setSubmitting(true);
    const result = await createBooking({
      customer_name: form.fullName,
      customer_phone: form.mobile,
      customer_email: form.email,
      city: form.city,
      address: form.address,
      pin_code: form.pinCode,
      treatment_slug: form.treatment,
      referral_code: form.referralCode,
      notes: form.message,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setForm(initial);
    close();
    router.push("/thank-you");
  }

  if (!isOpen) return null;

  const selected = availableTreatments.find((t) => t.slug === form.treatment);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="fixed inset-0 z-[9998] flex items-end justify-center p-0 sm:items-center sm:p-6"
    >
      <button
        aria-label="Close booking form"
        onClick={close}
        className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm animate-fadeUp"
      />

      <div className="relative w-full sm:max-w-2xl max-h-[min(92vh,calc(100dvh-24px))] overflow-y-auto overscroll-contain bg-white rounded-t-[28px] sm:rounded-[28px] shadow-premium animate-scaleIn">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-brand-border/60 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-brand-accent">
                Secure Booking
              </p>
            </div>
            <h3
              id="booking-title"
              className="mt-2 text-xl sm:text-2xl font-semibold text-brand-ink"
            >
              Book Your Consultation
            </h3>
          </div>
          <button
            aria-label="Close"
            onClick={close}
            className="h-10 w-10 shrink-0 rounded-full border border-brand-border/60 text-brand-ink hover:bg-brand-surface flex items-center justify-center transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-8 py-5 sm:py-8 grid gap-5 pb-[max(20px,env(safe-area-inset-bottom))]"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <input
                type="text"
                value={form.fullName}
                onChange={update("fullName")}
                placeholder="Enter your full name"
                className="premium-input"
                autoComplete="name"
              />
            </FormField>
            <FormField label="Mobile Number" required>
              <input
                type="tel"
                value={form.mobile}
                onChange={update("mobile")}
                placeholder="+91 XXXXX XXXXX"
                className="premium-input"
                autoComplete="tel"
              />
            </FormField>
          </div>

          <FormField label="Email Address">
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              className="premium-input"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Treatment / Kit" required>
            <select value={form.treatment} onChange={update("treatment")} className="premium-input">
              <option value="">Choose a treatment or kit</option>
              {availableTreatments.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title} - {t.priceLabel}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="City" required>
              <input
                type="text"
                value={form.city}
                onChange={update("city")}
                placeholder="Enter your city"
                className="premium-input"
                autoComplete="address-level2"
              />
            </FormField>
            <FormField label="Pin Code" required>
              <input
                type="text"
                value={form.pinCode}
                onChange={update("pinCode")}
                placeholder="Enter pin code"
                className="premium-input"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </FormField>
          </div>

          <FormField label="Address" required>
            <textarea
              value={form.address}
              onChange={update("address")}
              rows={2}
              placeholder="House, street, area"
              className="premium-input min-h-[92px] resize-none"
              autoComplete="street-address"
            />
          </FormField>

          <FormField label="Referral Code">
            <input
              type="text"
              value={form.referralCode}
              onChange={update("referralCode")}
              placeholder="OZO1003"
              className="premium-input uppercase"
            />
          </FormField>

          <FormField label="Your Message">
            <textarea
              value={form.message}
              onChange={update("message")}
              rows={4}
              placeholder="Tell us about your skin concerns..."
              className="premium-input min-h-[116px] resize-none"
            />
          </FormField>

          {selected && (
            <div className="rounded-2xl bg-gradient-to-r from-brand-surface to-white border border-brand-border/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-soft">
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
              <span className="text-xs font-semibold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-4 py-2 rounded-full text-center">
                Payment link sent after confirmation
              </span>
            </div>
          )}

          {selected?.slug === "korean-glass-treatment" && (
            <div className="rounded-2xl border border-brand-accent/20 bg-brand-accent/10 px-4 py-3 text-sm font-medium text-brand-ink">
              Our team will contact you on WhatsApp for campaign location and schedule.
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <p className="text-sm text-brand-muted leading-relaxed">
            By submitting, you agree to be contacted on WhatsApp/phone to confirm your booking.
            Need help? Call our customer care at{" "}
            <a
              href={`tel:${site.phoneRaw}`}
              className="font-semibold text-brand-ink hover:text-brand-accent transition-colors"
            >
              {site.phone}
            </a>
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end pt-2">
            <button type="button" onClick={close} className="btn-secondary justify-center">
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

          <p className="text-center text-sm text-brand-muted pt-1">
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
          min-height: 52px;
          border-radius: 14px;
          border: 1.5px solid #e3edf2;
          background: #fff;
          padding: 14px 16px;
          font-size: 16px;
          line-height: 1.35;
          color: #0b2030;
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }
        select.premium-input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230B2030'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 16px;
          padding-right: 44px;
        }
        .premium-input:focus {
          border-color: #1ba3c6;
          box-shadow: 0 0 0 4px rgba(27, 163, 198, 0.12);
        }
        select.premium-input:focus {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231BA3C6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }
        .premium-input::placeholder {
          color: #94a3b8;
        }
        .premium-input option {
          background: #fff;
          color: #0b2030;
          padding: 12px 16px;
        }
        @media (max-width: 420px) {
          .premium-input {
            min-height: 50px;
            padding: 13px 14px;
          }
        }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">
        {label}
        {required && <span className="text-brand-accent ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
