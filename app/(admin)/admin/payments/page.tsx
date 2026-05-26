"use client";

import { useState, useEffect } from "react";
import { getPayments, updatePaymentStatus } from "@/lib/actions/payments";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  }

  async function handleUpdateStatus(id: string, status: "created" | "authorized" | "captured" | "refunded" | "failed") {
    try {
      await updatePaymentStatus(id, status);
      await loadPayments();
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Error updating payment status");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "created":
        return "bg-brand-light text-brand-primaryDark";
      case "authorized":
        return "bg-yellow-100 text-yellow-700";
      case "captured":
        return "bg-green-100 text-green-700";
      case "refunded":
        return "bg-brand-light text-brand-primaryDark";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Payments</h1>
        <p className="text-sm text-brand-muted">View Razorpay payment transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-brand-surface/50 border-b border-brand-border">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Order ID</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Customer</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Amount</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Type</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Date</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">💳</span>
                    <p className="text-brand-muted">No payments found</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-mono text-xs text-brand-muted">{payment.order_id}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <p className="font-medium text-brand-ink">{payment.bookings?.customer_name || "N/A"}</p>
                      <p className="text-xs text-brand-muted">{payment.bookings?.customer_phone || "N/A"}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 font-medium text-brand-ink">₹{payment.amount?.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      payment.source_type === 'membership' ? 'bg-brand-surface text-brand-muted' : 'bg-brand-light/60 text-brand-primaryDark'
                    }`}>
                      {payment.source_type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-brand-muted">
                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <select
                      value={payment.status}
                      onChange={(e) => handleUpdateStatus(payment.id, e.target.value as any)}
                      className="px-2 py-1.5 text-xs border border-brand-border rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    >
                      <option value="created">Created</option>
                      <option value="authorized">Authorized</option>
                      <option value="captured">Captured</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
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
