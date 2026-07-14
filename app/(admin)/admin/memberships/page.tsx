"use client";

import { useEffect, useState } from "react";
import PartnerPasswordManager from "@/components/admin/PartnerPasswordManager";
import Breadcrumb from "@/components/admin/Breadcrumb";
import {
  approveAndCreatePartner,
  getMembershipRequests,
  repairPartnerAuthUser,
  updateMembershipAdminNotes,
  updateMembershipStatus,
  updatePaymentStatus,
} from "@/lib/actions/memberships";

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMemberships();

    const interval = window.setInterval(() => loadMemberships({ background: true }), 25000);
    const onFocus = () => loadMemberships({ background: true });
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function loadMemberships(options: { background?: boolean } = {}) {
    if (!options.background) setLoading(true);
    try {
      const result = await getMembershipRequests();
      const data = result.data || [];
      setQueryError(result.error || null);
      setDiagnostics(result.diagnostics || null);
      setMemberships(data);
      setAdminNotes(Object.fromEntries(data.map((item: any) => [item.id, item.admin_notes || ""])));
    } catch (err: any) {
      setQueryError(err?.message || "Unable to load membership requests.");
      setMemberships([]);
    } finally {
      if (!options.background) setLoading(false);
    }
  }

  async function handleMarkPaymentContacted(id: string) {
    setActionLoading(id);
    setMessage(null);
    try {
      await updateMembershipStatus(id, "under_review");
      setMessage({ type: "success", text: "Marked as payment contacted / under review" });
      await loadMemberships();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update request" });
    } finally {
      setActionLoading(null);
    }
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
          text: `Partner created! Partner ID: ${result.data.partner_code}. ${result.data.full_name} can now log in at /partner/login with email ${result.data.email} and the password they set while booking membership.`,
        });
      }
      await loadMemberships();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to approve" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRepairLogin(membership: any) {
    if (!confirm(`Repair login access for ${membership.email}? This will set a temporary password.`)) return;

    setActionLoading(membership.id);
    setMessage(null);
    try {
      const result = await repairPartnerAuthUser(membership.email);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result.data) {
        setMessage({ type: "success", text: result.data.message });
      }
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

  async function handleSaveNotes(id: string) {
    setActionLoading(id);
    setMessage(null);
    try {
      await updateMembershipAdminNotes(id, adminNotes[id] || "");
      setMessage({ type: "success", text: "Admin notes saved" });
      await loadMemberships();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save admin notes" });
    } finally {
      setActionLoading(null);
    }
  }

  function getActivationStatus(m: any): { label: string; color: string } {
    if (m.membership_status === "rejected") return { label: "Rejected", color: "bg-red-100 text-red-700" };
    if (m.membership_status === "active") return { label: "Approved", color: "bg-green-100 text-green-700" };
    if (m.membership_status === "under_review") return { label: "Payment Contacted", color: "bg-blue-100 text-blue-700" };
    if (m.payment_status === "paid") return { label: "Paid - Awaiting Approval", color: "bg-brand-light text-brand-primaryDark" };
    return { label: "Pending Payment", color: "bg-yellow-100 text-yellow-700" };
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Membership Requests" }]} />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-ink">Membership Requests</h1>
            <p className="text-sm text-brand-muted">Manage partner membership requests</p>
            {diagnostics && (
              <p className="mt-1 text-xs text-brand-muted">
                Source: {diagnostics.table} on project {diagnostics.projectRef}
                {typeof diagnostics.count === "number" ? ` - ${diagnostics.count} rows loaded` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => loadMemberships()}
            className="rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-surface"
          >
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {queryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-sm font-semibold">Unable to load membership requests</p>
          <p className="mt-1 text-xs">{queryError}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Name / IDs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Linked Referrer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Security / Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {queryError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="font-medium text-red-700">Database query failed</p>
                    <p className="mt-1 text-sm text-red-600">Use the error message above to diagnose the source table or policy issue.</p>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-brand-muted">No membership requests found</p>
                  </td>
                </tr>
              ) : (
                memberships.map((membership) => (
                  <tr key={membership.id} className="transition-colors hover:bg-brand-surface/30">
                    <td className="px-4 py-4 font-medium text-brand-ink sm:px-6">
                      <p>{membership.full_name}</p>
                      <div className="mt-1 space-y-0.5 text-[11px] font-normal text-brand-muted">
                        <p>Membership ID: {membership.membership_id || "-"}</p>
                        <p>Partner ID: {membership.partners?.partner_code || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{membership.mobile}</td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{membership.city}</td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{membership.email}</td>
                    <td className="px-4 py-4 text-sm sm:px-6">
                      <p className="font-mono font-semibold text-brand-primaryDark">
                        {membership.sponsor?.partner_code || membership.referral_code || "-"}
                      </p>
                      {membership.sponsor?.profiles?.full_name && (
                        <p className="mt-1 text-xs text-brand-muted">{membership.sponsor.profiles.full_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      {(() => {
                        const s = getActivationStatus(membership);
                        return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.color}`}>{s.label}</span>;
                      })()}
                      <div className="mt-2 text-[11px] leading-5 text-brand-muted">
                        <p>Created: {membership.created_at ? new Date(membership.created_at).toLocaleDateString("en-IN") : "-"}</p>
                        <p>Updated: {membership.updated_at ? new Date(membership.updated_at).toLocaleDateString("en-IN") : "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="min-w-[260px] space-y-2">
                        <p className="text-xs text-brand-muted">
                          Passwords are masked by Supabase Auth. Use reset with visibility toggle after approval.
                        </p>
                        <textarea
                          value={adminNotes[membership.id] || ""}
                          onChange={(e) => setAdminNotes((notes) => ({ ...notes, [membership.id]: e.target.value }))}
                          rows={2}
                          placeholder="Admin notes"
                          className="w-full rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <button
                          onClick={() => handleSaveNotes(membership.id)}
                          disabled={actionLoading === membership.id}
                          className="rounded border border-brand-border bg-white px-2 py-1 text-[10px] font-medium text-brand-ink hover:bg-brand-surface disabled:opacity-50"
                        >
                          Save Notes
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {membership.payment_status !== "paid" &&
                          membership.membership_status !== "under_review" &&
                          membership.membership_status !== "rejected" && (
                            <button
                              onClick={() => handleMarkPaymentContacted(membership.id)}
                              disabled={actionLoading === membership.id}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                            >
                              Payment Contacted
                            </button>
                          )}
                        {membership.payment_status !== "paid" && membership.membership_status !== "rejected" && (
                          <button
                            onClick={() => handleMarkPaid(membership.id)}
                            disabled={actionLoading === membership.id}
                            className="rounded-lg border border-brand-primary/20 bg-brand-light/55 px-3 py-1.5 text-xs font-medium text-brand-primaryDark transition-colors hover:bg-brand-light disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                        {membership.payment_status === "paid" &&
                          membership.membership_status !== "active" &&
                          membership.membership_status !== "rejected" && (
                            <button
                              onClick={() => handleApproveAndCreatePartner(membership)}
                              disabled={actionLoading === membership.id}
                              className="rounded-lg border border-brand-ink bg-brand-ink px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-muted disabled:opacity-50"
                            >
                              {actionLoading === membership.id ? "Processing..." : "Approve & Create Partner"}
                            </button>
                          )}
                        {membership.partner_id && membership.membership_status === "active" && (
                          <div className="flex min-w-[300px] flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-brand-accent">
                                {membership.partners?.partner_code || "-"}
                              </span>
                              <button
                                onClick={() => handleRepairLogin(membership)}
                                disabled={actionLoading === membership.id}
                                className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                                title="Repair Login Access"
                              >
                                {actionLoading === membership.id ? "..." : "Repair Login"}
                              </button>
                            </div>
                            <PartnerPasswordManager partnerId={membership.partner_id} compact />
                          </div>
                        )}
                        {membership.membership_status !== "rejected" && membership.membership_status !== "active" && (
                          <button
                            onClick={() => handleReject(membership.id)}
                            disabled={actionLoading === membership.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
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
