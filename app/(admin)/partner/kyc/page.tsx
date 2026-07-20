"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPartnerKycStatus, submitPartnerKyc } from "@/lib/actions/kyc";

type FileState = { file: File | null; preview: string | null; name: string | null };
const emptyFile: FileState = { file: null, preview: null, name: null };

export default function PartnerKycPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [partner, setPartner] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [maskedAccount, setMaskedAccount] = useState<string | null>(null);
  const [maskedUpi, setMaskedUpi] = useState<string | null>(null);

  // Form state
  const [method, setMethod] = useState<"bank" | "upi">("bank");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [registeredMobile, setRegisteredMobile] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Bank fields
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [branch, setBranch] = useState("");

  // UPI fields
  const [upiHolder, setUpiHolder] = useState("");
  const [upiId, setUpiId] = useState("");
  const [confirmUpi, setConfirmUpi] = useState("");

  // File fields
  const [panFile, setPanFile] = useState<FileState>(emptyFile);
  const [aadhaarFront, setAadhaarFront] = useState<FileState>(emptyFile);
  const [aadhaarBack, setAadhaarBack] = useState<FileState>(emptyFile);
  const [selfie, setSelfie] = useState<FileState>(emptyFile);

  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPartnerKycStatus();
      setPartner(data.partner);
      setKyc(data.kyc);
      setProfile(data.profile);
      setMaskedAccount(data.maskedAccount);
      setMaskedUpi(data.maskedUpi);

      const k = data.kyc;
      const p = data.partner;
      const pr = data.profile;

      const pm = k?.payment_method || (p?.upi_id ? "upi" : "bank");
      setMethod(pm);
      setFullName(k?.full_name || pr?.full_name || "");
      setMobile(k?.mobile_number || pr?.phone || "");
      setEmail(k?.email || pr?.email || "");
      setRegisteredMobile(k?.registered_mobile || k?.upi_mobile || pr?.phone || "");
      setPanNumber(k?.pan_number || p?.pan_number || "");
      setAccountHolder(k?.account_holder_name || p?.bank_account_holder || "");
      setBankName(k?.bank_name || p?.bank_name || "");
      setAccountNumber(k?.account_number || p?.bank_account_number || "");
      setConfirmAccount(k?.account_number || p?.bank_account_number || "");
      setIfsc(k?.bank_ifsc || p?.bank_ifsc || "");
      setBranch(k?.branch_name || p?.bank_branch_name || "");
      setUpiHolder(k?.upi_holder_name || "");
      setUpiId(k?.upi_id || p?.upi_id || "");
      setConfirmUpi(k?.upi_id || p?.upi_id || "");
    } catch (e: any) {
      setError(e?.message || "Failed to load KYC data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const status = partner?.kyc_status || "not_submitted";
  const locked = ["pending", "under_review", "verified", "approved"].includes(String(status));
  const canEdit = !locked || status === "rejected" || status === "resubmission_required" || status === "not_submitted";

  function handleFile(setter: (s: FileState) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be 10MB or smaller.");
        return;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      setter({ file, preview, name: file.name });
    };
  }

  function clearFile(setter: (s: FileState) => void, inputName: string) {
    setter(emptyFile);
    const input = formRef.current?.querySelector(`input[name="${inputName}"]`) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function clientValidate(): string | null {
    if (!fullName.trim()) return "Full name is required.";
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, "").slice(-10))) return "Enter a valid 10-digit mobile number.";
    if (!email.trim() || !email.includes("@")) return "Enter a valid email address.";
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase().replace(/\s/g, ""))) return "Enter a valid PAN number (e.g. ABCDE1234F).";

    if (method === "bank") {
      if (!accountHolder.trim()) return "Account holder name is required.";
      if (!bankName.trim()) return "Bank name is required.";
      if (!accountNumber.trim()) return "Account number is required.";
      if (!/^[0-9]{9,18}$/.test(accountNumber.replace(/\s/g, ""))) return "Account number must be 9-18 digits.";
      if (accountNumber.replace(/\s/g, "") !== confirmAccount.replace(/\s/g, "")) return "Account numbers do not match.";
      const cleanIfsc = ifsc.toUpperCase().replace(/\s/g, "");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) return "Enter a valid IFSC code (e.g. SBIN0001234).";
    }

    if (method === "upi") {
      if (!upiHolder.trim()) return "UPI holder name is required.";
      if (!upiId.trim()) return "UPI ID is required.";
      if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(upiId.trim())) return "Enter a valid UPI ID (e.g. name@bank).";
      if (upiId.trim().toLowerCase() !== confirmUpi.trim().toLowerCase()) return "UPI IDs do not match.";
    }

    const hasPan = panFile.file || kyc?.pan_card_path;
    const hasAadhaar = aadhaarFront.file || kyc?.aadhaar_front_path;
    const hasSelfie = selfie.file || kyc?.selfie_path;
    if (!hasPan) return "PAN card document is required.";
    if (!hasAadhaar) return "Aadhaar front document is required.";
    if (!hasSelfie) return "Selfie / verification photo is required.";

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = clientValidate();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("full_name", fullName.trim());
      formData.set("mobile_number", mobile.trim());
      formData.set("email", email.trim());
      formData.set("registered_mobile", registeredMobile.trim() || mobile.trim());
      formData.set("payment_method", method);
      formData.set("pan_number", panNumber.trim());

      if (method === "bank") {
        formData.set("account_holder_name", accountHolder.trim());
        formData.set("bank_name", bankName.trim());
        formData.set("account_number", accountNumber.replace(/\s/g, ""));
        formData.set("confirm_account_number", confirmAccount.replace(/\s/g, ""));
        formData.set("bank_ifsc", ifsc.toUpperCase().replace(/\s/g, ""));
        formData.set("branch_name", branch.trim());
      }

      if (method === "upi") {
        formData.set("upi_holder_name", upiHolder.trim());
        formData.set("upi_id", upiId.trim().toLowerCase());
        formData.set("confirm_upi_id", confirmUpi.trim().toLowerCase());
      }

      if (panFile.file) formData.set("pan_card", panFile.file);
      if (aadhaarFront.file) formData.set("aadhaar_front", aadhaarFront.file);
      if (aadhaarBack.file) formData.set("aadhaar_back", aadhaarBack.file);
      if (selfie.file) formData.set("selfie", selfie.file);

      const result = await submitPartnerKyc(formData);
      if (!result.success) {
        setError(result.error || "KYC submission failed.");
      } else {
        setSuccess("KYC submitted successfully! Admin will review your documents.");
        await load();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC & Bank Verification</h1>
        <p className="text-slate-600">Complete verification to unlock withdrawal requests.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Status Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Current status</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-900">{String(status).replace(/_/g, " ")}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Method: <span className="font-medium text-slate-900">{method === "upi" ? "UPI" : "Bank Account"}</span></p>
              {maskedAccount && <p>Account: <span className="font-mono text-slate-900">{maskedAccount}</span></p>}
              {maskedUpi && <p>UPI: <span className="font-mono text-slate-900">{maskedUpi}</span></p>}
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        {(partner?.payout_hold_reason || kyc?.rejection_reason || kyc?.resubmission_reason) && (
          <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-semibold">Reason: </span>
            {partner?.payout_hold_reason || kyc?.rejection_reason || kyc?.resubmission_reason}
          </p>
        )}
        {locked && status !== "rejected" && status !== "resubmission_required" && (
          <p className="mt-4 rounded-lg border border-brand-border bg-brand-surface/70 p-3 text-sm text-brand-muted">
            Your KYC is locked while under review or approved. Admin can request resubmission if any change is needed.
          </p>
        )}
      </div>

      {/* Form */}
      {canEdit && (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details */}
          <Section title="Personal Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name" value={fullName} onChange={setFullName} required placeholder="As per bank / Aadhaar" />
              <Field label="Mobile Number" value={mobile} onChange={setMobile} required inputMode="numeric" placeholder="10-digit mobile" />
              <Field label="Email" value={email} onChange={setEmail} required type="email" placeholder="you@example.com" />
              <Field label="Registered Payout Mobile" value={registeredMobile} onChange={setRegisteredMobile} inputMode="numeric" placeholder="Mobile linked to bank/UPI" />
            </div>
          </Section>

          {/* Payment Method Selector */}
          <Section title="Payout Method" subtitle="Choose exactly one. Only the selected method fields are required.">
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                active={method === "bank"}
                onClick={() => setMethod("bank")}
                title="Bank Account"
                description="NEFT / IMPS transfer using IFSC"
              />
              <MethodCard
                active={method === "upi"}
                onClick={() => setMethod("upi")}
                title="UPI"
                description="Instant payout to verified UPI ID"
              />
            </div>
          </Section>

          {/* Bank Details (shown only when bank is selected) */}
          {method === "bank" && (
            <Section title="Bank Account Details">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Account Holder Name" value={accountHolder} onChange={setAccountHolder} required placeholder="Name as per bank" />
                <Field label="Bank Name" value={bankName} onChange={setBankName} required placeholder="e.g. State Bank of India" />
                <Field label="Account Number" value={accountNumber} onChange={setAccountNumber} required inputMode="numeric" placeholder="9-18 digit account number" />
                <Field label="Confirm Account Number" value={confirmAccount} onChange={setConfirmAccount} required inputMode="numeric" placeholder="Re-enter account number" error={confirmAccount && accountNumber.replace(/\s/g, "") !== confirmAccount.replace(/\s/g, "") ? "Numbers don't match" : undefined} />
                <Field label="IFSC Code" value={ifsc} onChange={(v) => setIfsc(v.toUpperCase())} required placeholder="e.g. SBIN0001234" />
                <Field label="Branch Name" value={branch} onChange={setBranch} placeholder="Optional" />
              </div>
            </Section>
          )}

          {/* UPI Details (shown only when UPI is selected) */}
          {method === "upi" && (
            <Section title="UPI Details">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="UPI Holder Name" value={upiHolder} onChange={setUpiHolder} required placeholder="Name linked to UPI" />
                <Field label="UPI ID" value={upiId} onChange={setUpiId} required placeholder="name@bank" />
                <Field label="Confirm UPI ID" value={confirmUpi} onChange={setConfirmUpi} required placeholder="Re-enter UPI ID" error={confirmUpi && upiId.trim().toLowerCase() !== confirmUpi.trim().toLowerCase() ? "UPI IDs don't match" : undefined} />
              </div>
            </Section>
          )}

          {/* Identity Documents */}
          <Section title="Identity Documents" subtitle="PAN, Aadhaar front, and selfie are mandatory. Max 10MB each (JPG, PNG, WebP, PDF).">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="PAN Number" value={panNumber} onChange={(v) => setPanNumber(v.toUpperCase())} placeholder="ABCDE1234F" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload label="PAN Card *" name="pan_card" state={panFile} existing={kyc?.pan_card_path} onChange={handleFile(setPanFile)} onClear={() => clearFile(setPanFile, "pan_card")} />
              <FileUpload label="Aadhaar Front *" name="aadhaar_front" state={aadhaarFront} existing={kyc?.aadhaar_front_path} onChange={handleFile(setAadhaarFront)} onClear={() => clearFile(setAadhaarFront, "aadhaar_front")} />
              <FileUpload label="Aadhaar Back" name="aadhaar_back" state={aadhaarBack} existing={kyc?.aadhaar_back_path} onChange={handleFile(setAadhaarBack)} onClear={() => clearFile(setAadhaarBack, "aadhaar_back")} />
              <FileUpload label="Selfie / Verification Photo *" name="selfie" state={selfie} existing={kyc?.selfie_path} onChange={handleFile(setSelfie)} onClear={() => clearFile(setSelfie, "selfie")} capture />
            </div>
          </Section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-accent px-6 py-3.5 font-medium text-white transition-colors hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading & Submitting...
              </span>
            ) : status === "rejected" || status === "resubmission_required" ? (
              "Resubmit KYC"
            ) : (
              "Submit KYC for Review"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "verified" || status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "rejected" || status === "resubmission_required"
        ? "bg-red-100 text-red-700"
        : status === "pending" || status === "under_review"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-slate-100 text-slate-700";
  const label = status === "verified" ? "Approved" : String(status).replace(/_/g, " ");
  return <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${color}`}>{label}</span>;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MethodCard({ active, onClick, title, description }: { active: boolean; onClick: () => void; title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        active ? "border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/30" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-brand-accent" : "border-slate-300"}`}>
        {active && <div className="h-2.5 w-2.5 rounded-full bg-brand-accent" />}
      </div>
      <div>
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="text-sm text-slate-500">{description}</span>
      </div>
    </button>
  );
}

function Field({
  label, value, onChange, type = "text", required, inputMode, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; inputMode?: "numeric" | "email" | "tel";
  placeholder?: string; error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-1 text-brand-accent">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        className={`min-h-[44px] w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-brand-accent ${
          error ? "border-red-300 bg-red-50" : "border-slate-300"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function FileUpload({
  label, name, state, existing, onChange, onClear, capture,
}: {
  label: string; name: string; state: FileState; existing?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void; capture?: boolean;
}) {
  const hasFile = state.file || existing;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      {state.preview && (
        <div className="mb-3">
          <img src={state.preview} alt="Preview" className="h-24 w-auto rounded-lg border border-slate-200 object-cover" />
        </div>
      )}
      {state.name && (
        <p className="mb-2 text-xs text-slate-500">Selected: {state.name}</p>
      )}
      {!state.file && existing && (
        <p className="mb-2 text-xs text-green-600">Previously uploaded document on file</p>
      )}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
          {hasFile ? "Replace" : "Choose File"}
          <input
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            capture={capture ? "user" : undefined}
            onChange={onChange}
            className="hidden"
          />
        </label>
        {state.file && (
          <button type="button" onClick={onClear} className="text-xs text-red-600 hover:text-red-700">Remove</button>
        )}
      </div>
    </div>
  );
}
