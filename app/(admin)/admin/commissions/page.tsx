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
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
        <p className="text-slate-600">View and manage partner commissions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Partner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Percentage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No commissions found</td>
              </tr>
            ) : (
              commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {commission.partners?.partner_name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">₹{commission.commission_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{commission.commission_percentage}%</td>
                  <td className="px-6 py-4 text-slate-600">{commission.level}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)}`}>
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {commission.created_at ? new Date(commission.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={commission.status}
                      onChange={(e) => handleUpdateStatus(commission.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
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
