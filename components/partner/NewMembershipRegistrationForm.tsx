"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, UserPlus } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import { createSponsoredMembership } from "@/lib/actions/memberships";

export default function NewMembershipRegistrationForm({ partnerCode }: { partnerCode: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    city: "",
    address: "",
    pinCode: "",
    notes: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await createSponsoredMembership({
      full_name: formData.fullName,
      mobile: formData.mobile,
      email: formData.email,
      city: formData.city,
      address: formData.address,
      pin_code: formData.pinCode,
      notes: formData.notes || undefined,
      password: formData.password,
      confirm_password: formData.confirmPassword,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] border border-brand-border bg-white/90 p-8 text-center shadow-premium">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-primary" />
        <h2 className="mt-4 text-2xl font-semibold text-brand-ink">Membership Request Submitted</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-brand-muted">
          The new member is linked under your Partner ID <span className="font-mono font-semibold text-brand-primaryDark">{partnerCode}</span>.
          Their request is now ready for admin payment review and approval.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/partner/direct-team" className="btn-primary justify-center">
            View Direct Team
          </Link>
          <Link href="/partner/dashboard" className="btn-secondary justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20";

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="partner-new-membership-form"
      className="rounded-[2rem] border border-brand-border bg-white/90 p-5 shadow-premium sm:p-8"
    >
      <div className="mb-7 flex items-start gap-4 rounded-2xl bg-brand-surface/65 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-ink text-white">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-brand-ink">Linked Referrer</p>
          <p className="mt-1 text-sm text-brand-muted">
            This registration will be saved under <span className="font-mono font-semibold text-brand-primaryDark">{partnerCode}</span>.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name *">
          <input className={inputClass} name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter full name" />
        </Field>
        <Field label="Mobile Number *">
          <input className={inputClass} name="mobile" type="tel" value={formData.mobile} onChange={handleChange} required placeholder="+91 XXXXX XXXXX" />
        </Field>
        <Field label="Email Address *">
          <input className={inputClass} name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="member@email.com" />
        </Field>
        <Field label="City *">
          <input className={inputClass} name="city" value={formData.city} onChange={handleChange} required placeholder="Enter city" />
        </Field>
        <Field label="Set Password *">
          <PasswordInput className={inputClass} name="password" minLength={8} autoComplete="new-password" value={formData.password} onChange={handleChange} required placeholder="Minimum 8 characters" />
        </Field>
        <Field label="Confirm Password *">
          <PasswordInput className={inputClass} name="confirmPassword" minLength={8} autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" />
        </Field>
        <Field label="Pin Code *">
          <input className={inputClass} name="pinCode" value={formData.pinCode} onChange={handleChange} required placeholder="Enter pin code" />
        </Field>
        <Field label="Referral Partner ID">
          <input className={`${inputClass} bg-brand-surface/45 font-mono`} value={partnerCode} readOnly aria-readonly="true" />
        </Field>
        <Field label="Full Address *" className="sm:col-span-2">
          <textarea className={`${inputClass} resize-none`} name="address" rows={3} value={formData.address} onChange={handleChange} required placeholder="Enter full address" />
        </Field>
        <Field label="Notes (Optional)" className="sm:col-span-2">
          <textarea className={`${inputClass} resize-none`} name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Any note for the admin team" />
        </Field>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/partner/dashboard" className="btn-secondary justify-center">
          Cancel
        </Link>
        <button type="submit" disabled={loading} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Submitting..." : "Submit Membership Request"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-brand-ink ${className}`}>
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
