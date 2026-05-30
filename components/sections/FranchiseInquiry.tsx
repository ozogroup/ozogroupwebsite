"use client";

import { useRef, useState, useTransition } from "react";
import { submitFranchiseLead } from "@/lib/actions/franchise-leads";

const inputClass =
  "w-full rounded-xl border border-[#EDE5D8] bg-white px-4 py-3 text-sm text-[#5B4C46] outline-none transition focus:border-[#9CAF88] focus:ring-2 focus:ring-[#9CAF88]/25";

export default function FranchiseInquiry() {
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
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B4C46] to-[#6A5A53] shadow-premium">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 md:p-12 lg:p-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5D8]/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#EDE5D8]">
                Franchise
              </div>
              <h2 className="mt-6 text-white">Start Your KIA Skin Care Franchise</h2>
              <p className="mt-4 max-w-md text-base text-[#EDE5D8]">
                Build your skincare business with KIA Korean Skin Care.
              </p>
              <div className="mt-8 h-px w-full max-w-xs bg-gradient-to-r from-[#9CAF88] to-transparent" />
            </div>

            <div className="bg-white p-6 md:p-8 lg:p-10">
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
                    className="w-full rounded-full bg-[#5B4C46] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#6A5A53] disabled:cursor-not-allowed disabled:opacity-60"
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
