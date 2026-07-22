"use client";

import { useState } from "react";
import { X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface PayoutConfirmModalProps {
  payout: any;
  onConfirm: (note: string) => Promise<void>;
  onCancel: () => void;
}

function money(v: number) {
  return `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
}

function profileName(value: any) {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.full_name || "Unknown";
}

function fullAccount(input?: string | null) {
  const clean = String(input || "").replace(/\s+/g, "");
  return clean || null;
}

export default function PayoutConfirmModal({ payout, onConfirm, onCancel }: PayoutConfirmModalProps) {
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"confirm" | "processing" | "done" | "failed">("confirm");
  const [error, setError] = useState("");

  const partner = payout?.partner;
  const profile = Array.isArray(partner?.profiles) ? partner.profiles[0] : partner?.profiles;
  const partnerName = profile?.full_name || "Unknown";
  const partnerCode = partner?.partner_code || payout?.partner_code || "—";
  const paymentMethod = payout?.payment_method || (partner?.upi_id ? "upi" : "bank");
  const gross = Number(payout?.gross_amount || payout?.amount || 0);
  const deduction = Number(payout?.deduction_amount || 0);
  const net = Number(payout?.net_amount || payout?.amount || 0);

  async function handleConfirm() {
    setPhase("processing");
    setError("");
    try {
      await onConfirm(note);
      setPhase("done");
    } catch (e: any) {
      setError(e?.message || "Payment failed. Please try again.");
      setPhase("failed");
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm" onClick={phase === "confirm" || phase === "failed" ? onCancel : undefined} />
      <div className="fixed inset-0 z-[56] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
            <h2 className="text-lg font-semibold text-slate-900">
              {phase === "done" ? "Payment Completed" : phase === "processing" ? "Processing Payment..." : "Confirm Payout"}
            </h2>
            {(phase === "confirm" || phase === "failed" || phase === "done") && (
              <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
            {/* Success state */}
            {phase === "done" && (
              <div className="flex flex-col items-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="mt-4 text-lg font-semibold text-emerald-700">Payment Completed</p>
                <p className="mt-1 text-sm text-slate-600">Payout has been marked as paid. Partner wallet debited and email sent.</p>
              </div>
            )}

            {/* Processing state */}
            {phase === "processing" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-brand-accent" />
                <p className="mt-4 text-sm font-medium text-slate-600">Processing payment, updating wallet, sending email...</p>
              </div>
            )}

            {/* Confirm / Failed state */}
            {(phase === "confirm" || phase === "failed") && (
              <>
                {/* Partner Info */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Partner Name</p>
                      <p className="font-semibold text-slate-900">{partnerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Partner ID</p>
                      <p className="font-mono font-semibold text-brand-primaryDark">{partnerCode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Payment Method</p>
                      <p className="font-semibold text-slate-900">{paymentMethod === "upi" ? "UPI" : "Bank Transfer"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">
                        {paymentMethod === "upi" ? "UPI ID" : "Bank Account"}
                      </p>
                      {paymentMethod === "upi" ? (
                        <p className="font-mono font-semibold text-slate-900">{partner?.upi_id || payout?.upi_id || "—"}</p>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-900">{partner?.bank_name || payout?.bank_name || "—"}</p>
                          <p className="font-mono text-xs text-slate-700 mt-0.5">A/C: {fullAccount(partner?.bank_account_number || payout?.bank_account_number) || "—"}</p>
                          {(partner?.bank_ifsc || payout?.bank_ifsc) && (
                            <p className="font-mono text-xs text-slate-600">IFSC: {partner?.bank_ifsc || payout?.bank_ifsc}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Gross Income</span>
                    <span className="font-semibold text-slate-900">{money(gross)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>15% Deduction</span>
                    <span className="font-semibold">-{money(deduction)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                    <span className="font-bold text-slate-900">Net Payout</span>
                    <span className="font-bold text-emerald-700 text-lg">{money(net)}</span>
                  </div>
                </div>

                {/* Payment Date */}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Payment Date</span>
                  <span className="font-medium text-slate-900">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>

                {/* Admin Note */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Admin Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note for this payment..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold">This action cannot be undone.</p>
                    <p className="mt-0.5">This will auto-generate a KIA Payout ID, debit the partner&apos;s wallet to zero, settle commissions (FIFO), and send a payout confirmation email.</p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0 bg-white">
            {phase === "done" && (
              <button type="button" onClick={onCancel} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Close
              </button>
            )}
            {(phase === "confirm" || phase === "failed") && (
              <>
                <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {phase === "failed" ? "Retry Payment" : "Confirm & Mark Paid"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
