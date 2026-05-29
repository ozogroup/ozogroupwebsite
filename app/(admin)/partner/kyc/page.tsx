import { getPartnerKycStatus, submitPartnerKyc } from "@/lib/actions/kyc";
import type { HTMLAttributes } from "react";

export const dynamic = "force-dynamic";

export default async function PartnerKycPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { partner, kyc, profile } = await getPartnerKycStatus();
  const kycData = kyc as any;
  const status = partner?.kyc_status || "not_submitted";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC & Bank Verification</h1>
        <p className="text-slate-600">
          Complete verification to unlock withdrawal requests.
        </p>
      </div>

      {searchParams.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {searchParams.error}
        </div>
      )}
      {searchParams.success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {searchParams.success}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Current status</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 capitalize">
              {status.replace("_", " ")}
            </p>
          </div>
          <span
            className={`w-fit px-3 py-1 rounded-full text-xs font-semibold ${
              status === "verified"
                ? "bg-green-100 text-green-700"
                : status === "rejected"
                ? "bg-red-100 text-red-700"
                : status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {status === "verified" ? "Approved" : status.replace("_", " ")}
          </span>
        </div>
        {(partner?.payout_hold_reason || kycData?.rejection_reason) && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
            {partner?.payout_hold_reason || kycData?.rejection_reason}
          </p>
        )}
      </div>

      <form
        action={submitPartnerKyc}
        className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-slate-200 space-y-8"
      >
        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" name="full_name" defaultValue={kycData?.full_name || profile.full_name || ""} required />
            <Field label="Mobile Number" name="mobile_number" defaultValue={kycData?.mobile_number || profile.phone || ""} inputMode="numeric" placeholder="10 digit mobile number" required />
            <Field label="Email" name="email" type="email" defaultValue={kycData?.email || profile.email || ""} required />
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Holder Name" name="account_holder_name" defaultValue={kycData?.account_holder_name || partner?.bank_account_holder || ""} required />
            <Field label="Bank Name" name="bank_name" defaultValue={kycData?.bank_name || partner?.bank_name || ""} required />
            <Field label="Account Number" name="account_number" defaultValue={kycData?.account_number || partner?.bank_account_number || ""} inputMode="numeric" required />
            <Field label="Confirm Account Number" name="confirm_account_number" defaultValue={kycData?.account_number || partner?.bank_account_number || ""} inputMode="numeric" required />
            <Field label="IFSC Code" name="bank_ifsc" defaultValue={kycData?.bank_ifsc || partner?.bank_ifsc || ""} placeholder="ABCD0123456" required />
            <Field label="Branch Name" name="branch_name" defaultValue={kycData?.branch_name || ""} />
          </div>
        </section>

        <section className="rounded-xl border border-brand-primary/20 bg-brand-light/45 p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">UPI Details</h2>
            <p className="text-sm text-slate-600">Optional when bank details are complete. Add UPI for faster payout choices.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="UPI Holder Name" name="upi_holder_name" defaultValue={kycData?.upi_holder_name || ""} />
            <Field label="UPI Mobile Number" name="upi_mobile" defaultValue={kycData?.upi_mobile || ""} inputMode="numeric" placeholder="10 digit mobile number" />
            <Field label="UPI ID" name="upi_id" defaultValue={kycData?.upi_id || partner?.upi_id || ""} placeholder="name@bank" />
            <SelectField label="Preferred UPI App" name="upi_app" defaultValue={kycData?.upi_app || ""} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileField label="PAN Card Upload" name="pan_card" />
            <FileField label="Aadhaar Front Upload" name="aadhaar_front" />
            <FileField label="Aadhaar Back Upload" name="aadhaar_back" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            JPG, PNG, WebP, or PDF. Files are stored privately and reviewed only by admins.
          </p>
        </section>

        <button
          type="submit"
          className="px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors"
        >
          Submit KYC for Review
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
      <span className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-brand-accent ml-1">*</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        className="w-full min-h-[44px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-2">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue || ""}
        className="w-full min-h-[44px] px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
      >
        <option value="">Select app</option>
        <option value="Google Pay">Google Pay</option>
        <option value="PhonePe">PhonePe</option>
        <option value="Paytm">Paytm</option>
        <option value="BHIM">BHIM</option>
        <option value="Other">Other</option>
      </select>
    </label>
  );
}

function FileField({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-brand-accent ml-1">*</span>}
      </span>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required={required}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-ink hover:file:bg-brand-accent/10"
      />
    </label>
  );
}
