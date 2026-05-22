import { getPartnerKycStatus, submitPartnerKyc } from "@/lib/actions/kyc";

export const dynamic = "force-dynamic";

export default async function PartnerKycPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { partner, kyc, profile } = await getPartnerKycStatus();
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
        {(partner?.kyc_rejection_reason || kyc?.rejection_reason) && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
            {partner?.kyc_rejection_reason || kyc?.rejection_reason}
          </p>
        )}
      </div>

      <form
        action={submitPartnerKyc}
        className="bg-white rounded-xl shadow-sm p-5 sm:p-6 border border-slate-200 space-y-8"
      >
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" name="full_name" defaultValue={kyc?.full_name || profile.full_name || ""} required />
            <Field label="Mobile Number" name="mobile_number" defaultValue={kyc?.mobile_number || profile.phone || ""} required />
            <Field label="Email" name="email" type="email" defaultValue={kyc?.email || profile.email || ""} required />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Holder Name" name="account_holder_name" defaultValue={kyc?.account_holder_name || partner?.bank_account_holder || ""} required />
            <Field label="Bank Name" name="bank_name" defaultValue={kyc?.bank_name || partner?.bank_name || ""} required />
            <Field label="Account Number" name="account_number" defaultValue={kyc?.account_number || partner?.bank_account_number || ""} required />
            <Field label="Confirm Account Number" name="confirm_account_number" defaultValue={kyc?.account_number || partner?.bank_account_number || ""} required />
            <Field label="IFSC Code" name="bank_ifsc" defaultValue={kyc?.bank_ifsc || partner?.bank_ifsc || ""} required />
            <Field label="Branch Name" name="branch_name" defaultValue={kyc?.branch_name || partner?.bank_branch_name || ""} required />
            <Field label="UPI ID" name="upi_id" defaultValue={kyc?.upi_id || partner?.upi_id || ""} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileField label="PAN Card Upload" name="pan_card" required={!kyc?.pan_card_path} />
            <FileField label="Aadhaar Front Upload" name="aadhaar_front" required={!kyc?.aadhaar_front_path} />
            <FileField label="Aadhaar Back Upload" name="aadhaar_back" required={!kyc?.aadhaar_back_path} />
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
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
        className="w-full min-h-[44px] px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
      />
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
