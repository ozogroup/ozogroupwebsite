"use client";

import { useState, useEffect } from "react";
import { getMembershipRequests, updateMembershipStatus, updatePaymentStatus, approveAndCreatePartner } from "@/lib/actions/memberships";
import Breadcrumb from "@/components/admin/Breadcrumb";

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadMemberships();
  }, []);

  async function loadMemberships() {
    setLoading(true);
    const data = await getMembershipRequests();
    setMemberships(data);
    setLoading(false);
  }

  async function handleMarkPaid(id: string) {
    setActionLoading(id);
    setMessage(null);
    try {
      await updatePaymentStatus(id, "paid");
      setMessage({ type: "success", text: "Payment marked as paid" });
      await loadMemberships();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update payment" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveAndCreatePartner(membership: any) {
    setActionLoading(membership.id);
    setMessage(null);
    try {
      const result = await approveAndCreatePartner(membership.id);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result.data) {
        setMessage({
          type: "success",
          text: `Partner created! Code: ${result.data.partner_code}. Tell ${result.data.full_name} to go to /partner/login and use "Forgot Password" with email ${result.data.email} to set their password.`,
        });
      }
      await loadMemberships();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to approve" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Reject this membership request?")) return;
    setActionLoading(id);
    setMessage(null);
    try {
      await updateMembershipStatus(id, "rejected");
      setMessage({ type: "success", text: "Membership rejected" });
      await loadMemberships();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to reject" });
    } finally {
      setActionLoading(null);
    }
  }

  function getActivationStatus(m: any): { label: string; color: string } {
    if (m.membership_status === "rejected") return { label: "Rejected", color: "bg-red-100 text-red-700" };
    if (m.partner_id) return { label: "Partner Created", color: "bg-green-100 text-green-700" };
    if (m.membership_status === "approved" || m.membership_status === "active") return { label: "Approved", color: "bg-green-100 text-green-700" };
    if (m.payment_status === "paid") return { label: "Paid - Awaiting Approval", color: "bg-blue-100 text-blue-700" };
    return { label: "Pending Payment", color: "bg-yellow-100 text-yellow-700" };
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

      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-brand-surface/50 border-b border-brand-border">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Name</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Phone</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">City</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Email</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Ref Code</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
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
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{membership.mobile}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{membership.city}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{membership.email}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{membership.referral_code || "—"}</td>
                  <td className="px-4 sm:px-6 py-4">
                    {(() => {
                      const s = getActivationStatus(membership);
                      return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${s.color}`}>{s.label}</span>;
                    })()}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      {membership.payment_status !== "paid" && membership.membership_status !== "rejected" && (
                        <button
                          onClick={() => handleMarkPaid(membership.id)}
                          disabled={actionLoading === membership.id}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {membership.payment_status === "paid" && !membership.partner_id && membership.membership_status !== "rejected" && (
                        <button
                          onClick={() => handleApproveAndCreatePartner(membership)}
                          disabled={actionLoading === membership.id}
                          className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === membership.id ? "Processing..." : "Approve & Create Partner"}
                        </button>
                      )}
                      {membership.partner_id && (
                        <div className="text-xs text-brand-muted">
                          <span className="font-mono text-brand-accent">{membership.partner_code || "—"}</span>
                        </div>
                      )}
                      {membership.membership_status !== "rejected" && membership.membership_status !== "approved" && !membership.partner_id && (
                        <button
                          onClick={() => handleReject(membership.id)}
                          disabled={actionLoading === membership.id}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      )}
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
