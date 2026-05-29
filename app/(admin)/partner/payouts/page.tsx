"use client";

import { useEffect, useState } from "react";
import { getPartnerPayoutContext, requestPartnerPayout } from "@/lib/actions/payouts";

export default function PartnerPayoutsPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [partner, setPartner] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "upi">("bank");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getPartnerPayoutContext();
    setPartner(data.partner);
    setKyc(data.kyc);
    setPayouts(data.payouts);
    if (!data.partner?.bank_account_number && (data.kyc?.upi_id || data.partner?.upi_id)) {
      setPaymentMethod("upi");
    }
    setLoading(false);
  }

  const wallet = Number(partner?.wallet_balance || 0);
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
    wallet < 1000 ? "Minimum wallet balance is ₹1000" : null,
  ].filter(Boolean);
  const hasBank = Boolean(partner?.bank_account_holder && partner?.bank_name && partner?.bank_account_number && partner?.bank_ifsc);
  const hasUpi = Boolean(kyc?.upi_id || partner?.upi_id);
  const canRequest = restrictions.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const result = await requestPartnerPayout(Number(amount), paymentMethod);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Payout request submitted successfully.");
      setAmount("");
      await load();
    }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="p-8 text-brand-muted">Loading payout details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payout Request</h1>
        <p className="text-slate-600">Withdraw approved wallet earnings after KYC verification.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Wallet</h2>
          <div className="p-6 bg-brand-accent/10 rounded-lg text-center">
            <p className="text-4xl font-bold text-brand-accent">₹{wallet.toLocaleString("en-IN")}</p>
            <p className="text-sm text-slate-600 mt-2">Minimum payout: ₹1000</p>
          </div>
          <div className="mt-4 text-sm text-slate-600 space-y-1">
            <p>KYC: <span className="font-semibold capitalize">{partner?.kyc_status || "not_submitted"}</span></p>
            <p>Bank: <span className="font-semibold">{partner?.bank_verified ? "Verified" : "Not verified"}</span></p>
            <p>UPI: <span className="font-semibold">{hasUpi ? "Available" : "Not added"}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Request Payout</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
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
                  <span className="font-semibold text-slate-900">₹{requestedGross.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-red-700">
                  <span>15% deduction</span>
                  <span className="font-semibold">-₹{payoutDeduction.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-3 flex justify-between gap-3 border-t border-brand-border pt-3">
                  <span className="font-semibold text-brand-ink">Net payable</span>
                  <span className="font-bold text-brand-accent">₹{netPayable.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payout Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`rounded-xl border p-3 text-sm ${paymentMethod === "bank" ? "border-brand-accent bg-brand-accent/10" : "border-slate-200 bg-white"}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={() => setPaymentMethod("bank")}
                    disabled={!hasBank || !canRequest}
                    className="mr-2"
                  />
                  Bank Transfer
                  <span className="block pl-5 text-xs text-slate-500">{hasBank ? partner?.bank_name || "Bank details saved" : "Bank details missing"}</span>
                </label>
                <label className={`rounded-xl border p-3 text-sm ${paymentMethod === "upi" ? "border-brand-accent bg-brand-accent/10" : "border-slate-200 bg-white"}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={() => setPaymentMethod("upi")}
                    disabled={!hasUpi || !canRequest}
                    className="mr-2"
                  />
                  UPI
                  <span className="block pl-5 text-xs text-slate-500">{hasUpi ? kyc?.upi_id || partner?.upi_id : "UPI details missing"}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Saved Bank Details</h2>
          <div className="space-y-1 text-sm text-slate-600">
            <p><span className="font-medium text-slate-800">Holder:</span> {partner?.bank_account_holder || "-"}</p>
            <p><span className="font-medium text-slate-800">Bank:</span> {partner?.bank_name || "-"}</p>
            <p><span className="font-medium text-slate-800">Account:</span> {partner?.bank_account_number || "-"}</p>
            <p><span className="font-medium text-slate-800">IFSC:</span> {partner?.bank_ifsc || "-"}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Saved UPI Details</h2>
          <div className="space-y-1 text-sm text-slate-600">
            <p><span className="font-medium text-slate-800">Holder:</span> {kyc?.upi_holder_name || "-"}</p>
            <p><span className="font-medium text-slate-800">Mobile:</span> {kyc?.upi_mobile || "-"}</p>
            <p><span className="font-medium text-slate-800">UPI ID:</span> {kyc?.upi_id || partner?.upi_id || "-"}</p>
            <p><span className="font-medium text-slate-800">App:</span> {kyc?.upi_app || "-"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Net Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Deduction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">No payout requests found</td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-4 py-4 text-sm text-slate-600">{new Date(payout.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-brand-ink">₹{Number(payout.net_amount || payout.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      Gross ₹{Number(payout.gross_amount || payout.available_balance || payout.amount || 0).toLocaleString("en-IN")}
                      <br />
                      15% -₹{Number(payout.deduction_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-sm capitalize">{payout.status}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{payout.transaction_reference || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
