"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PartnerPayoutsPage() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payouts, setPayouts] = useState<any[]>([]);

  // Fetch data on mount
  useEffect(() => {
    loadPayoutData();
  }, []);

  async function loadPayoutData() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch pending commissions
      const { data: commissions } = await supabase
        .from("commissions" as any)
        .select("commission_amount")
        .eq("partner_id", user.id)
        .eq("status", "pending");

      const balance = (commissions || []).reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0);
      setAvailableBalance(balance);

      // Fetch payout history
      const { data: payoutData } = await supabase
        .from("payouts" as any)
        .select("*")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false });

      setPayouts(payoutData || []);
    } catch (err: any) {
      console.error("Error loading payout data:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1000) {
      setError("Minimum payout amount is ₹1000");
      setLoading(false);
      return;
    }

    if (amountNum > availableBalance) {
      setError("Insufficient balance");
      setLoading(false);
      return;
    }

    if (!paymentMethod || !paymentDetails) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Create payout request
      const { error: payoutError } = await supabase
        .from("payouts" as any)
        .insert({
          partner_id: user.id,
          amount: amountNum,
          method: paymentMethod,
          payment_details: paymentDetails,
          status: "pending",
        });

      if (payoutError) {
        setError(payoutError.message || "Failed to create payout request");
      } else {
        setSuccess("Payout request submitted successfully!");
        setAmount("");
        setPaymentMethod("");
        setPaymentDetails("");
        loadPayoutData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create payout request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payout Request</h1>
        <p className="text-slate-600">Request payout from your wallet balance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Balance</h2>
          <div className="p-6 bg-brand-accent/10 rounded-lg text-center">
            <p className="text-4xl font-bold text-brand-accent">₹{availableBalance.toLocaleString()}</p>
            <p className="text-sm text-slate-600 mt-2">Available for withdrawal</p>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">Minimum payout: ₹1000</p>
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
                max={availableBalance}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                required
              >
                <option value="">Select payment method</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {paymentMethod === "upi" ? "UPI ID" : "Bank Account Details"}
              </label>
              <textarea
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                rows={3}
                placeholder={
                  paymentMethod === "upi"
                    ? "Enter your UPI ID (e.g., example@upi)"
                    : paymentMethod === "bank"
                    ? "Account number, IFSC code, Bank name, Account holder name"
                    : "Enter your UPI ID or bank account details"
                }
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Payout Request"}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-4">Processing time: 7 business days</p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payout History</h2>
        {payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(payout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-ink">₹{payout.amount?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{payout.method || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payout.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : payout.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : payout.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {payout.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No payout requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}
