"use client";

import { useState, useEffect } from "react";
import { getMembershipRequests, updateMembershipStatus, updatePaymentStatus, generateReferralCode } from "@/lib/actions/memberships";
import Breadcrumb from "@/components/admin/Breadcrumb";

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
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Membership Requests" }]} />
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Membership Requests</h1>
        <p className="text-sm text-brand-muted">Manage partner membership requests</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-brand-surface/50 border-b border-brand-border">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Name</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Phone</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">City</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Referral Code</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Payment</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Membership</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">👥</span>
                    <p className="text-brand-muted">No membership requests found</p>
                  </div>
                </td>
              </tr>
            ) : (
              memberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-medium text-brand-ink">{membership.full_name}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{membership.phone}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{membership.city}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">
                    {membership.generated_referral_code || (
                      <button
                        onClick={() => handleGenerateReferralCode(membership.id)}
                        className="text-xs text-brand-accent hover:underline"
                      >
                        Generate
                      </button>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(membership.payment_status)}`}>
                      {membership.payment_status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getMembershipStatusColor(membership.membership_status)}`}>
                      {membership.membership_status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <select
                      value={membership.membership_status}
                      onChange={(e) => handleUpdateMembershipStatus(membership.id, e.target.value)}
                      className="px-2 py-1.5 text-xs border border-brand-border rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    >
                      <option value="pending_payment">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
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
