"use client";

import { useState, useEffect } from "react";
import { getCommissions, updateCommissionStatus } from "@/lib/actions/commissions";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissions();
  }, []);

  async function loadCommissions() {
    setLoading(true);
    const data = await getCommissions();
    setCommissions(data);
    setLoading(false);
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await updateCommissionStatus(id, status);
      await loadCommissions();
    } catch (error) {
      console.error("Error updating commission status:", error);
      alert("Error updating commission status");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "cancelled":
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
        <h1 className="font-display text-2xl font-bold text-brand-ink">Commissions</h1>
        <p className="text-sm text-brand-muted">View partner commissions</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-brand-surface/50 border-b border-brand-border">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Partner</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Level</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Amount</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Created At</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">💰</span>
                    <p className="text-brand-muted">No commissions found</p>
                  </div>
                </td>
              </tr>
            ) : (
              commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-medium text-brand-ink">
                    {commission.partners?.partner_name || "Unknown"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{commission.level}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">₹{commission.commission_amount?.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)}`}>
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">
                    {commission.created_at ? new Date(commission.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <select
                      value={commission.status}
                      onChange={(e) => handleUpdateStatus(commission.id, e.target.value)}
                      className="px-2 py-1.5 text-xs border border-brand-border rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
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
