import { getPartnerKycStatus, submitPartnerKyc } from "@/lib/actions/kyc";
import type { HTMLAttributes } from "react";

export const dynamic = "force-dynamic";

export default async function PartnerKycPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { partner, kyc, profile, maskedAccount, maskedUpi } = await getPartnerKycStatus();
  const kycData = kyc as any;
  const status = partner?.kyc_status || "not_submitted";
  const paymentMethod = kycData?.payment_method || (partner?.upi_id ? "upi" : "bank");
  const locked = ["pending", "under_review", "verified", "approved"].includes(String(status));

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC & Payout Details</h1>
        <p className="text-slate-600">Complete secure verification before withdrawal requests. Choose either Bank Account or UPI.</p>
      </div>

      {resolvedSearchParams.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {resolvedSearchParams.error}
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {resolvedSearchParams.success}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Current verification status</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-900">{String(status).replace(/_/g, " ")}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Method: <span className="font-medium text-slate-900">{paymentMethod === "upi" ? "UPI" : "Bank Account"}</span></p>
              {maskedAccount && <p>Account: <span className="font-mono text-slate-900">{maskedAccount}</span></p>}
              {maskedUpi && <p>UPI: <span className="font-mono text-slate-900">{maskedUpi}</span></p>}
            </div>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              status === "verified" || status === "approved"
                ? "bg-green-100 text-green-700"
                : status === "rejected" || status === "resubmission_required"
                  ? "bg-red-100 text-red-700"
                  : status === "pending" || status === "under_review"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-slate-100 text-slate-700"
            }`}
          >
            {status === "verified" ? "Approved" : String(status).replace(/_/g, " ")}
          </span>
        </div>
        {(partner?.payout_hold_reason || kycData?.rejection_reason || kycData?.resubmission_reason) && (
          <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {partner?.payout_hold_reason || kycData?.rejection_reason || kycData?.resubmission_reason}
          </p>
        )}
        {locked && status !== "rejected" && status !== "resubmission_required" && (
          <p className="mt-4 rounded-lg border border-brand-border bg-brand-surface/70 p-3 text-sm text-brand-muted">
            Your submitted KYC is locked while it is under review or approved. Admin can request resubmission if any change is needed.
          </p>
        )}
      </div>

      <form action={submitPartnerKyc} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Personal Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full Name" name="full_name" defaultValue={kycData?.full_name || profile.full_name || ""} required />
            <Field label="Mobile Number" name="mobile_number" defaultValue={kycData?.mobile_number || profile.phone || ""} inputMode="numeric" placeholder="10 digit mobile number" required />
            <Field label="Email" name="email" type="email" defaultValue={kycData?.email || profile.email || ""} required />
            <Field label="Registered Payout Mobile" name="registered_mobile" defaultValue={kycData?.registered_mobile || kycData?.upi_mobile || profile.phone || ""} inputMode="numeric" required />
          </div>
        </section>

        <section className="rounded-xl border border-brand-primary/20 bg-brand-light/40 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Payout Method</h2>
          <p className="mt-1 text-sm text-slate-600">Choose exactly one destination. Only the selected method is required.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-white p-4">
              <input type="radio" name="payment_method" value="bank" defaultChecked={paymentMethod !== "upi"} />
              <span>
                <span className="block font-semibold text-slate-900">Bank Account</span>
                <span className="text-sm text-slate-600">NEFT/IMPS payout with IFSC.</span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-brand-border bg-white p-4">
              <input type="radio" name="payment_method" value="upi" defaultChecked={paymentMethod === "upi"} />
              <span>
                <span className="block font-semibold text-slate-900">UPI</span>
                <span className="text-sm text-slate-600">Fast payout to verified UPI ID.</span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Bank Account Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Account Holder Name" name="account_holder_name" defaultValue={kycData?.account_holder_name || partner?.bank_account_holder || ""} />
            <Field label="Bank Name" name="bank_name" defaultValue={kycData?.bank_name || partner?.bank_name || ""} />
            <Field label="Account Number" name="account_number" defaultValue={kycData?.account_number || partner?.bank_account_number || ""} inputMode="numeric" />
            <Field label="Confirm Account Number" name="confirm_account_number" defaultValue={kycData?.account_number || partner?.bank_account_number || ""} inputMode="numeric" />
            <Field label="IFSC Code" name="bank_ifsc" defaultValue={kycData?.bank_ifsc || partner?.bank_ifsc || ""} placeholder="ABCD0123456" />
            <Field label="Branch Name" name="branch_name" defaultValue={kycData?.branch_name || partner?.bank_branch_name || ""} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">UPI Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="UPI Account Holder Name" name="upi_holder_name" defaultValue={kycData?.upi_holder_name || ""} />
            <Field label="UPI ID" name="upi_id" defaultValue={kycData?.upi_id || partner?.upi_id || ""} placeholder="name@bank" />
            <Field label="Confirm UPI ID" name="confirm_upi_id" defaultValue={kycData?.upi_id || partner?.upi_id || ""} placeholder="name@bank" />
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Identity Documents</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="PAN Number" name="pan_number" defaultValue={kycData?.pan_number || partner?.pan_number || ""} placeholder="ABCDE1234F" />
            <FileField label="PAN Card Upload" name="pan_card" />
            <FileField label="Aadhaar Front Upload" name="aadhaar_front" />
            <FileField label="Aadhaar Back Upload" name="aadhaar_back" />
            <FileField label="Live Selfie / Verification Photo" name="selfie" accept="image/jpeg,image/png,image/webp" capture />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            PAN, Aadhaar, and selfie are mandatory. Cancelled cheque is not required. Files are stored privately and reviewed only by admins.
          </p>
        </section>

        <button type="submit" className="rounded-lg bg-brand-accent px-6 py-3 font-medium text-white transition-colors hover:bg-brand-accent/90">
          {status === "rejected" || status === "resubmission_required" ? "Resubmit KYC" : "Submit KYC for Review"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  inputMode,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-brand-accent">*</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        className="min-h-[44px] w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-brand-accent"
      />
    </label>
  );
}

function FileField({ label, name, accept, capture }: { label: string; name: string; accept?: string; capture?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type="file"
        accept={accept || "image/jpeg,image/png,image/webp,application/pdf"}
        capture={capture ? "user" : undefined}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-ink hover:file:bg-brand-accent/10"
      />
    </label>
  );
}
