"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { submitFranchiseLead } from "@/lib/actions/franchise-leads";

const inputClass =
  "w-full rounded-2xl border border-[#EDE5D8] bg-[#F8F4EC]/80 px-4 py-3.5 text-sm text-[#5B4C46] shadow-inner outline-none transition placeholder:text-[#6A5A53]/45 focus:border-[#9CAF88] focus:bg-white focus:ring-4 focus:ring-[#9CAF88]/15";

const benefits = ["Brand Support", "Training Guidance", "City Growth Opportunity"];

export default function FranchiseInquiry({
  title = "Start Your KIA Skin Care Franchise",
  subtitle = "Build your skincare business with KIA Korean Skin Care.",
  image = "/images/client-approved/franchise-income-model.jpeg",
}: {
  title?: string;
  subtitle?: string;
  image?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    <section className="section bg-[#F8F4EC]">
      <div className="container-x">
        <div className="overflow-hidden rounded-[2rem] border border-[#EDE5D8] bg-white shadow-[0_28px_90px_rgba(91,76,70,0.18)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#4C3F3A] via-[#5B4C46] to-[#6A5A53] p-8 md:p-12 lg:p-14">
              <div
                aria-hidden
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#EDE5D8]/20 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute bottom-8 left-8 h-32 w-32 rounded-full bg-[#9CAF88]/20 blur-2xl"
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5D8]/30 bg-[#F8F4EC]/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F8F4EC] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                  FRANCHISE OPPORTUNITY
                </div>
                <h2 className="mt-7 max-w-lg text-white">{title}</h2>
                <p className="mt-5 max-w-md text-base leading-7 text-[#EDE5D8]">
                  {subtitle}
                </p>
                <div className="mt-9 h-px w-full max-w-sm bg-gradient-to-r from-[#EDE5D8]/80 via-[#9CAF88] to-transparent" />

                <div className="mt-8 space-y-3">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-3 rounded-2xl border border-[#EDE5D8]/18 bg-white/[0.08] px-4 py-3 text-sm font-medium text-[#F8F4EC] backdrop-blur"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#9CAF88] shadow-[0_0_18px_rgba(156,175,136,0.75)]" />
                      {benefit}
                    </div>
                  ))}
                </div>

                <div className="relative mt-8 aspect-[4/5] overflow-hidden rounded-2xl border border-[#EDE5D8]/20 bg-[#F8F4EC] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
                  <Image
                    src={image}
                    alt="KIA Skin Care franchise opportunity"
                    fill
                    sizes="(max-width: 1024px) 90vw, 480px"
                    className="object-contain"
                  />
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <MiniStat value="Premium" label="Brand Position" />
                  <MiniStat value="Guided" label="Setup Support" />
                  <MiniStat value="Local" label="Market Focus" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-[#F8F4EC] p-6 md:p-8 lg:p-10">
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
                    className="w-full rounded-full bg-gradient-to-r from-[#5B4C46] to-[#6A5A53] px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(91,76,70,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(91,76,70,0.34)] focus:outline-none focus:ring-4 focus:ring-[#9CAF88]/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
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

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#EDE5D8]/18 bg-[#F8F4EC]/10 px-4 py-3">
      <p className="text-sm font-semibold leading-none text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#EDE5D8]/80">{label}</p>
    </div>
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
