"use client";

import { useEffect, useState } from "react";
import {
  X, ShieldCheck, CheckCircle, XCircle, RotateCcw,
  User, CreditCard, FileText, ExternalLink,
} from "lucide-react";
import { reviewKycSubmission } from "@/lib/actions/kyc";

interface KycReviewDrawerProps {
  item: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function KycReviewDrawer({ item, onClose, onUpdated }: KycReviewDrawerProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomedImg) setZoomedImg(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, zoomedImg]);

  async function handleReview(status: "verified" | "rejected" | "under_review" | "resubmission_required") {
    if ((status === "rejected" || status === "resubmission_required") && !reason.trim()) {
      alert("Please enter a reason for rejection / resubmission.");
      return;
    }
    if (status === "verified") {
      if (!window.confirm(
        `Approve KYC for ${item.full_name}?\n\nThis will:\n• Mark KYC as Verified\n• Enable payout eligibility\n• Sync all details to Google Sheet\n\nPlease ensure you have reviewed all documents carefully.`
      )) return;
    }
    setBusy(true);
    try {
      await reviewKycSubmission(item.id, status, reason);
      onUpdated();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Failed to update KYC status");
    } finally {
      setBusy(false);
    }
  }

  const docs = [
    { key: "pan", label: "PAN Card", url: item.pan_card_url, required: true },
    { key: "aadhaar_front", label: "Aadhaar Front", url: item.aadhaar_front_url, required: true },
    { key: "aadhaar_back", label: "Aadhaar Back", url: item.aadhaar_back_url, required: true },
    { key: "selfie", label: "Live Selfie", url: item.selfie_url, required: true },
    { key: "cheque", label: "Cheque / Passbook", url: item.cheque_url, required: item.payment_method !== "upi" },
  ];

  const isPdf = (url: string) => /\.pdf/i.test(url.split("?")[0]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Zoomed image overlay */}
      {zoomedImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-8" onClick={() => setZoomedImg(null)}>
          <img src={zoomedImg} alt="Document" className="max-h-full max-w-full rounded-lg object-contain" />
          <button type="button" onClick={() => setZoomedImg(null)} className="absolute right-6 top-6 rounded-full bg-white/20 p-2 text-white hover:bg-white/40">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
              <ShieldCheck className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-ink">KYC Review</h2>
              <p className="text-xs text-brand-muted">{item.partner?.partner_code} &middot; {item.full_name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Partner Info */}
          <section className="rounded-xl border border-brand-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-brand-accent" />
              <h3 className="text-sm font-semibold text-brand-ink">Partner Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Full Name" value={item.full_name} />
              <InfoRow label="Partner ID" value={item.partner?.partner_code} mono />
              <InfoRow label="Email" value={item.email} />
              <InfoRow label="Mobile" value={item.mobile_number} />
              <InfoRow label="Partner Status" value={item.partner_status} />
              <InfoRow label="Current KYC" value={(item.kyc_status || "unknown").replace(/_/g, " ")} />
            </div>
          </section>

          {/* Payment Method Details */}
          <section className="rounded-xl border border-brand-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-brand-accent" />
              <h3 className="text-sm font-semibold text-brand-ink">
                Payment Method — {item.payment_method === "upi" ? "UPI" : "Bank Account"}
              </h3>
            </div>
            {item.payment_method === "upi" ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="UPI Holder Name" value={item.upi_holder_name} />
                <InfoRow label="UPI ID" value={item.masked_upi_id} mono />
                <InfoRow label="Registered Mobile" value={item.upi_mobile} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Account Holder" value={item.account_holder_name} />
                <InfoRow label="Bank Name" value={item.bank_name} />
                <InfoRow label="Account Number" value={item.masked_account_number} mono />
                <InfoRow label="IFSC Code" value={item.bank_ifsc} mono />
                <InfoRow label="Branch" value={item.branch_name} />
              </div>
            )}
          </section>

          {/* Documents - rendered inline */}
          <section className="rounded-xl border border-brand-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-brand-accent" />
              <h3 className="text-sm font-semibold text-brand-ink">Identity Documents</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {docs.map((doc) => (
                <div key={doc.key} className="rounded-xl border border-brand-border overflow-hidden">
                  <div className="flex items-center justify-between bg-brand-surface/60 px-3 py-2">
                    <span className="text-xs font-semibold text-brand-ink">{doc.label}</span>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-brand-accent hover:underline">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className={`text-[10px] font-medium ${doc.required ? "text-red-600" : "text-slate-400"}`}>
                        {doc.required ? "MISSING" : "Not uploaded"}
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 p-2 min-h-[140px] flex items-center justify-center">
                    {doc.url ? (
                      isPdf(doc.url) ? (
                        <div className="text-center">
                          <FileText className="mx-auto h-10 w-10 text-brand-muted" />
                          <p className="mt-2 text-xs text-brand-muted">PDF Document</p>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-brand-accent hover:underline">
                            View PDF
                          </a>
                        </div>
                      ) : (
                        <img
                          src={doc.url}
                          alt={doc.label}
                          className="max-h-[200px] w-full rounded-lg object-contain cursor-zoom-in"
                          onClick={() => setZoomedImg(doc.url!)}
                        />
                      )
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-1 text-[10px] text-slate-400">{doc.required ? "Required — not uploaded" : "Optional"}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Previous rejection reason */}
          {(item.rejection_reason || item.resubmission_reason) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Previous Reason</p>
              <p className="text-sm text-red-700">{item.rejection_reason || item.resubmission_reason}</p>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-brand-border bg-white p-5 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required for reject / resubmission)"
            rows={2}
            className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleReview("verified")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {busy ? "Processing..." : "Approve KYC"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleReview("rejected")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleReview("resubmission_required")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Resubmit
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-brand-muted uppercase tracking-wide">{label}</p>
      <p className={`font-medium text-brand-ink ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</p>
    </div>
  );
}
