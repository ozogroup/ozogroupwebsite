"use client";

import { useState, useEffect } from "react";
import { getMembershipRequests, updateMembershipStatus, updatePaymentStatus, generateReferralCode } from "@/lib/actions/memberships";

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberships();
  }, []);

  async function loadMemberships() {
    setLoading(true);
    const data = await getMembershipRequests();
    setMemberships(data);
    setLoading(false);
  }

  async function handleUpdateMembershipStatus(id: string, status: string) {
    try {
      await updateMembershipStatus(id, status);
      await loadMemberships();
    } catch (error) {
      console.error("Error updating membership status:", error);
      alert("Error updating membership status");
    }
  }

  async function handleUpdatePaymentStatus(id: string, paymentStatus: string) {
    try {
      await updatePaymentStatus(id, paymentStatus);
      await loadMemberships();
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Error updating payment status");
    }
  }

  async function handleGenerateReferralCode(id: string) {
    const code = prompt("Enter referral code to assign:");
    if (!code) return;
    try {
      await generateReferralCode(id, code);
      await loadMemberships();
    } catch (error) {
      console.error("Error generating referral code:", error);
      alert("Error generating referral code");
    }
  }

  function getMembershipStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function getPaymentStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "failed":
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
        <h1 className="text-2xl font-bold text-slate-900">Membership Requests</h1>
        <p className="text-slate-600">Manage partner membership requests</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Referral Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Membership</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No membership requests found</td>
              </tr>
            ) : (
              memberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{membership.full_name}</td>
                  <td className="px-6 py-4 text-slate-600">{membership.phone}</td>
                  <td className="px-6 py-4 text-slate-600">{membership.city}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {membership.generated_referral_code || (
                      <button
                        onClick={() => handleGenerateReferralCode(membership.id)}
                        className="text-xs text-brand-accent hover:underline"
                      >
                        Generate
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(membership.payment_status)}`}>
                      {membership.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMembershipStatusColor(membership.membership_status)}`}>
                      {membership.membership_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={membership.membership_status}
                        onChange={(e) => handleUpdateMembershipStatus(membership.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <select
                        value={membership.payment_status}
                        onChange={(e) => handleUpdatePaymentStatus(membership.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
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
