"use client";

import { useEffect, useState } from "react";
import { Phone, MapPin, Mail, Link2, RefreshCw, Search } from "lucide-react";
import PartnerPasswordManager from "@/components/admin/PartnerPasswordManager";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { Badge, Card, PageHeader, EmptyState } from "@/components/admin/ui";
import {
  approveAndCreatePartner,
  getMembershipRequests,
  repairPartnerAuthUser,
  updateMembershipAdminNotes,
  updateMembershipStatus,
  updatePaymentStatus,
} from "@/lib/actions/memberships";

function getActivationStatus(m: any): { label: string; variant: "danger" | "success" | "info" | "warning" } {
  if (m.membership_status === "rejected") return { label: "Rejected", variant: "danger" };
  if (m.membership_status === "active") return { label: "Approved", variant: "success" };
  if (m.membership_status === "under_review") return { label: "Payment Contacted", variant: "info" };
  if (m.payment_status === "paid") return { label: "Paid - Awaiting Approval", variant: "info" };
  return { label: "Pending Payment", variant: "warning" };
}

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

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

  const filtered = memberships.filter((m) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [m.full_name, m.email, m.mobile, m.membership_id, m.partners?.partner_code, m.sponsor?.partner_code]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

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
      <PageHeader
        title="Membership Requests"
        description={
          diagnostics
            ? `Source: ${diagnostics.table} on project ${diagnostics.projectRef}${typeof diagnostics.count === "number" ? ` — ${diagnostics.count} rows loaded` : ""}`
            : "Manage partner membership requests"
        }
        actions={
          <button
            type="button"
            onClick={() => loadMemberships()}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-surface"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

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

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, ID..."
          className="w-full rounded-lg border border-brand-border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-brand-accent focus:ring-2 focus:ring-brand-accent"
        />
      </div>

      {queryError ? null : filtered.length === 0 ? (
        <Card>
          <EmptyState title="No membership requests found" description="Try a different search, or check back after a new signup." />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((membership) => {
            const status = getActivationStatus(membership);
            const notesOpen = expandedNotes[membership.id] ?? false;
            return (
              <Card key={membership.id} noPadding>
                <div className="flex flex-col gap-4 p-5">
                  {/* Top row: identity + status */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-sm font-semibold text-white">
                        {(membership.full_name || "?")[0]}
                      </div>
                      <div>
                        <p className="font-display text-base font-semibold text-brand-ink">{membership.full_name}</p>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-brand-muted">
                          <span>Membership ID: <span className="font-mono">{membership.membership_id || "-"}</span></span>
                          {membership.partners?.partner_code && (
                            <span>Partner ID: <span className="font-mono font-semibold text-brand-primaryDark">{membership.partners.partner_code}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={status.variant} dot>{status.label}</Badge>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 gap-3 rounded-lg bg-brand-surface/50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2 text-brand-muted">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {membership.mobile || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-brand-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {membership.city || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-brand-muted sm:col-span-2 lg:col-span-1">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{membership.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-muted">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {membership.sponsor?.partner_code || membership.referral_code ? (
                          <>
                            <span className="font-mono font-semibold text-brand-primaryDark">
                              {membership.sponsor?.partner_code || membership.referral_code}
                            </span>
                            {(() => { const sp = Array.isArray(membership.sponsor?.profiles) ? membership.sponsor.profiles[0] : membership.sponsor?.profiles; return sp?.full_name ? ` · ${sp.full_name}` : null; })()}
                          </>
                        ) : (
                          "No referrer"
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-brand-muted">
                    Created {membership.created_at ? new Date(membership.created_at).toLocaleDateString("en-IN") : "-"}
                    {" · "}Updated {membership.updated_at ? new Date(membership.updated_at).toLocaleDateString("en-IN") : "-"}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-brand-border pt-4">
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
                    {membership.membership_status !== "rejected" && membership.membership_status !== "active" && (
                      <button
                        onClick={() => handleReject(membership.id)}
                        disabled={actionLoading === membership.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {membership.partner_id && membership.membership_status === "active" && (
                      <button
                        onClick={() => handleRepairLogin(membership)}
                        disabled={actionLoading === membership.id}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                      >
                        {actionLoading === membership.id ? "..." : "Repair Login"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedNotes((prev) => ({ ...prev, [membership.id]: !notesOpen }))}
                      className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-ink"
                    >
                      {notesOpen ? "Hide notes & security" : "Notes & security"}
                    </button>
                  </div>

                  {/* Collapsible: notes + password manager */}
                  {notesOpen && (
                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-brand-border bg-brand-surface/40 p-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Admin Notes</p>
                        <textarea
                          value={adminNotes[membership.id] || ""}
                          onChange={(e) => setAdminNotes((notes) => ({ ...notes, [membership.id]: e.target.value }))}
                          rows={3}
                          placeholder="Admin notes"
                          className="w-full rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <button
                          onClick={() => handleSaveNotes(membership.id)}
                          disabled={actionLoading === membership.id}
                          className="mt-2 rounded border border-brand-border bg-white px-2 py-1 text-[10px] font-medium text-brand-ink hover:bg-brand-surface disabled:opacity-50"
                        >
                          Save Notes
                        </button>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Login / Password</p>
                        <p className="mb-2 text-xs text-brand-muted">
                          Passwords are masked by Supabase Auth. Use reset with visibility toggle after approval.
                        </p>
                        {membership.partner_id ? (
                          <PartnerPasswordManager partnerId={membership.partner_id} compact />
                        ) : (
                          <p className="text-xs text-brand-muted italic">Available after the partner account is created.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
