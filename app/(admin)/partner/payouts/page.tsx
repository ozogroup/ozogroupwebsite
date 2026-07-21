"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPartnerPayoutContext, requestPartnerPayout } from "@/lib/actions/payouts";

function maskAccount(input?: string | null) {
  const clean = String(input || "").replace(/\s+/g, "");
  if (!clean || clean.length < 4) return null;
  return `XXXX${clean.slice(-4)}`;
}

export default function PartnerPayoutsPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [partner, setPartner] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "upi">("bank");

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getPartnerPayoutContext();
      setPartner(data.partner);
      setKyc(data.kyc as any);
      setPayouts(data.payouts);
      if (!data.partner?.bank_account_number && data.partner?.upi_id) {
        setPaymentMethod("upi");
      }
    } catch {
      // non-fatal on background refresh
    }
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Polling for real-time updates (every 20s) + on focus
  useEffect(() => {
    const refresh = () => void load(false);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 20000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [load]);

  const wallet = Number(partner?.wallet_balance || 0);
  const totalPaid = Number(partner?.paid_earnings || 0);
  const grossAvailable = wallet;
  const availableDeduction = Math.round(grossAvailable * 0.15 * 100) / 100;
  const availableNetPayable = Math.max(0, grossAvailable - availableDeduction);
  const requestedGross = Number(amount || 0);
  const payoutDeduction = Math.round(requestedGross * 0.15 * 100) / 100;
  const netPayable = Math.max(0, requestedGross - payoutDeduction);
  const membershipActive =
    partner?.status === "active" &&
    (!partner?.membership_expires_at || new Date(partner.membership_expires_at).getTime() >= Date.now());
  const restrictions = [
    partner?.kyc_status !== "verified" ? "KYC must be approved" : null,
    !partner?.bank_verified ? "Bank details must be verified" : null,
    !membershipActive ? "Membership must be active" : null,
    wallet < 1000 ? "Minimum wallet balance is Rs. 1000" : null,
  ].filter(Boolean);
  const hasBank = Boolean(partner?.bank_account_holder && partner?.bank_account_number && partner?.bank_ifsc);
  const hasUpi = Boolean(partner?.upi_id);
  const canRequest = restrictions.length === 0;

  const lastPaidPayout = payouts.find((p: any) => p.status === "paid");
  const lastPayoutDate = lastPaidPayout?.paid_at ? new Date(lastPaidPayout.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;
  const lastPayoutAmount = lastPaidPayout ? Number(lastPaidPayout.net_amount || lastPaidPayout.amount || 0) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const result = await requestPartnerPayout(Number(amount), paymentMethod);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Payout request submitted successfully.");
        setAmount("");
        await load(false);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to submit payout request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-brand-muted">Loading payout details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payout Request</h1>
        <p className="text-slate-600">
          Withdraw approved wallet earnings after KYC verification. A 15% admin/service fee is deducted from gross payout, and the net payable amount is transferred.
        </p>
      </div>

      {restrictions.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <p className="font-semibold mb-2">Withdrawal is currently locked</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            {restrictions.map((item) => (
              <li key={item as string}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {wallet === 0 && restrictions.length === 0 && (
        <div className="rounded-xl border border-brand-border bg-white p-4 text-sm font-medium text-brand-muted shadow-sm">
          No payout available yet.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <PayoutMetric label="Wallet Balance" value={`Rs. ${wallet.toLocaleString("en-IN")}`} />
        <PayoutMetric label="Total Paid" value={`Rs. ${totalPaid.toLocaleString("en-IN")}`} accent />
        <PayoutMetric label="15% Deduction" value={`-Rs. ${availableDeduction.toLocaleString("en-IN")}`} danger />
        <PayoutMetric label="Net Payable" value={`Rs. ${availableNetPayable.toLocaleString("en-IN")}`} />
      </div>

      {lastPaidPayout && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Last Payout</p>
            <p className="text-xs text-emerald-700">{lastPayoutDate}</p>
          </div>
          <p className="text-lg font-bold text-emerald-700">Rs. {lastPayoutAmount.toLocaleString("en-IN")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Wallet</h2>
          <div className="p-6 bg-brand-accent/10 rounded-lg text-center">
            <p className="text-4xl font-bold text-brand-accent">Rs. {wallet.toLocaleString("en-IN")}</p>
            <p className="text-sm text-slate-600 mt-2">Minimum payout: Rs. 1000</p>
            <p className="mt-2 text-xs text-slate-600">Final payment = requested gross amount - 15% deduction.</p>
          </div>
          <div className="mt-4 text-sm text-slate-600 space-y-1">
            <p>KYC: <span className="font-semibold capitalize">{partner?.kyc_status === "verified" ? "Approved" : (partner?.kyc_status || "not_submitted").replace(/_/g, " ")}</span></p>
            <p>Bank: <span className="font-semibold">{partner?.bank_verified ? "Verified" : "Not verified"}</span></p>
            <p>UPI: <span className="font-semibold">{hasUpi ? "Available" : "Not added"}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Request Payout</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (Rs.)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="Enter amount"
                min="1000"
                max={wallet}
                required
                disabled={!canRequest}
              />
            </div>
            {requestedGross > 0 && (
              <div className="rounded-xl border border-brand-border bg-brand-surface/60 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-600">Gross request</span>
                  <span className="font-semibold text-slate-900">Rs. {requestedGross.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-red-700">
                  <span>15% deduction</span>
                  <span className="font-semibold">-Rs. {payoutDeduction.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-3 flex justify-between gap-3 border-t border-brand-border pt-3">
                  <span className="font-semibold text-brand-ink">Net payable</span>
                  <span className="font-bold text-brand-accent">Rs. {netPayable.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payout Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`rounded-xl border p-3 text-sm ${paymentMethod === "bank" ? "border-brand-accent bg-brand-accent/10" : "border-slate-200 bg-white"}`}>
                  <input type="radio" name="payment_method" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} disabled={!hasBank || !canRequest} className="mr-2" />
                  Bank Transfer
                  <span className="block pl-5 text-xs text-slate-500">{hasBank ? `${maskAccount(partner?.bank_account_number)}` : "Bank details missing"}</span>
                </label>
                <label className={`rounded-xl border p-3 text-sm ${paymentMethod === "upi" ? "border-brand-accent bg-brand-accent/10" : "border-slate-200 bg-white"}`}>
                  <input type="radio" name="payment_method" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} disabled={!hasUpi || !canRequest} className="mr-2" />
                  UPI
                  <span className="block pl-5 text-xs text-slate-500">{hasUpi ? partner?.upi_id : "UPI details missing"}</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !canRequest}
              className="w-full px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Payout Request"}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {success && <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{success}</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sr.</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">KIA Payout ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">Gross</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">Deduction</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">Net Paid</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Account</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">No payout requests found</td>
                </tr>
              ) : (
                payouts.map((payout, idx) => {
                  const kiaId = payout.admin_notes?.match(/KIA-\S+/)?.[0] || payout.transaction_reference || null;
                  const gross = Number(payout.gross_amount || payout.available_balance || payout.amount || 0);
                  const deduction = Number(payout.deduction_amount || 0);
                  const net = Number(payout.net_amount || payout.amount || 0);
                  const pm = payout.payment_method || "bank";
                  const maskedAcc = pm === "upi"
                    ? (partner?.upi_id || "—")
                    : maskAccount(partner?.bank_account_number) || "—";
                  return (
                    <tr key={payout.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-4 text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-4">
                        {kiaId ? (
                          <span className="font-mono text-xs font-semibold text-emerald-700">{kiaId}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(payout.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        {payout.paid_at && (
                          <p className="text-[10px] text-green-700">Paid: {new Date(payout.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right text-sm text-slate-700">Rs. {gross.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-4 text-right text-sm text-red-600">-Rs. {deduction.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-4 text-right text-sm font-semibold text-brand-ink">Rs. {net.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-4 text-xs text-slate-600 uppercase">{pm}</td>
                      <td className="px-3 py-4 text-xs font-mono text-slate-600">{maskedAcc}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          payout.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          payout.status === "rejected" ? "bg-red-100 text-red-700" :
                          payout.status === "processing" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PayoutMetric({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-2 text-xl font-bold ${accent ? "text-brand-accent" : danger ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
