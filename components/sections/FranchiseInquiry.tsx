"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { submitFranchiseLead } from "@/lib/actions/franchise-leads";

const inputClass =
  "w-full rounded-2xl border border-[#EDE5D8] bg-[#F8F4EC]/80 px-4 py-3.5 text-sm text-[#5B4C46] shadow-inner outline-none transition placeholder:text-[#6A5A53]/45 focus:border-[#9CAF88] focus:bg-white focus:ring-4 focus:ring-[#9CAF88]/15";

const FRANCHISE_BANNER = "/images/client-approved/franchise-banner-final.png";

export default function FranchiseInquiry({
  title = "Start Your KIA Skin Care Franchise",
  subtitle = "Build your skincare business with KIA Korean Skin Care.",
  image,
}: {
  title?: string;
  subtitle?: string;
  image?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const bannerImage = image && /^https?:\/\//i.test(image) ? image : FRANCHISE_BANNER;

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitFranchiseLead(formData);
      if (result.success) {
        formRef.current?.reset();
        setMessage({ type: "success", text: "Thank you. Our team will contact you shortly." });
      } else {
        setMessage({ type: "error", text: result.error || "Unable to submit inquiry. Please try again." });
      }
    });
  }

  return (
    <section className="bg-[#F8F4EC] py-12 md:py-16 lg:py-20">
      <div className="container-x">
        <div className="mx-auto max-w-[1400px]">
          <div className="relative aspect-video w-full overflow-hidden rounded-[32px] bg-[#EDE5D8] shadow-[0_16px_48px_rgba(91,78,74,0.10)]">
            <Image
              src={bannerImage}
              alt="KIA Skin Care franchise opportunity"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1400px"
              className="object-cover object-center"
            />
          </div>

          <div className="mt-7 grid gap-6 lg:mt-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
            <div className="rounded-[32px] bg-gradient-to-br from-[#5B4E4A] to-[#6E5E58] p-6 text-white md:p-10 lg:p-12">
              <div className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
                Franchise Opportunity
              </div>
              <h2 className="mt-6 text-white">{title}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/80">{subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Brand Support", "Training Guidance", "City Growth Opportunity"].map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#A6B39E]" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] md:p-10 lg:p-12">
              {message && (
                <div
                  className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "border-[#9CAF88]/40 bg-[#9CAF88]/10 text-[#5B4C46]"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form ref={formRef} action={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" name="full_name" required />
                <Field label="Mobile Number" name="mobile" type="tel" required />
                <Field label="City" name="city" required />
                <Field label="Current Business" name="current_business" />
                <Field label="Investment Budget" name="investment_budget" />
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#5B4C46]" htmlFor="franchise-message">
                    Message
                  </label>
                  <textarea id="franchise-message" name="message" rows={4} className={`${inputClass} resize-none`} />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-14 w-full rounded-full bg-gradient-to-br from-[#5B4E4A] to-[#7A6660] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(91,78,74,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(91,78,74,0.30)] focus:outline-none focus:ring-4 focus:ring-[#9CAF88]/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                  >
                    {isPending ? "Submitting..." : "Submit Franchise Inquiry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  const id = `franchise-${name}`;
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#5B4C46]" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={name} type={type} required={required} className={inputClass} />
    </div>
  );
}
