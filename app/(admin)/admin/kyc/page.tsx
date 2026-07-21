"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search, ShieldCheck, FileText, CheckCircle, XCircle, RotateCcw, Clock, RefreshCw } from "lucide-react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { getKycSubmissions, reviewKycSubmission } from "@/lib/actions/kyc";
import { Badge, Card, EmptyState, StatCard } from "@/components/admin/ui";
import KycReviewDrawer from "@/components/admin/KycReviewDrawer";

type KycRow = any;
type Tab = "pending" | "approved" | "rejected" | "resubmit";

function statusBadge(status: string) {
  if (status === "verified" || status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "resubmission_required") return "warning";
  if (status === "pending" || status === "under_review") return "warning";
  return "neutral";
}

const isPending = (item: any) => ["pending", "under_review"].includes(item.kyc_status) && !item.bank_verified;
const isApproved = (item: any) => ["verified", "approved"].includes(item.kyc_status) || item.bank_verified === true;
const isRejected = (item: any) => item.kyc_status === "rejected" && !item.bank_verified;
const isResubmit = (item: any) => item.kyc_status === "resubmission_required" && !item.bank_verified;

export default function AdminKycPage() {
  const [items, setItems] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [reviewItem, setReviewItem] = useState<KycRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getKycSubmissions());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, status: "verified" | "rejected" | "pending" | "under_review" | "resubmission_required") {
    if ((status === "rejected" || status === "resubmission_required") && !reason[id]?.trim()) {
      alert("Please enter a reason first.");
      return;
    }
    setBusy(id);
    try {
      await reviewKycSubmission(id, status, reason[id]);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to update KYC");
    } finally {
      setBusy(null);
    }
  }

  const counts = useMemo(() => ({
    pending: items.filter((i) => isPending(i)).length,
    approved: items.filter((i) => isApproved(i)).length,
    rejected: items.filter((i) => isRejected(i)).length,
    resubmit: items.filter((i) => isResubmit(i)).length,
  }), [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTab =
        tab === "pending" ? isPending(item) :
        tab === "approved" ? isApproved(item) :
        tab === "rejected" ? isRejected(item) :
        isResubmit(item);
      if (!matchesTab) return false;
      if (!term) return true;
      const haystack = [
        item.full_name, item.partner?.partner_code, item.mobile_number,
        item.email, item.payment_method,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [items, search, tab]);

  const tabConfig: { key: Tab; label: string; count: number; icon: typeof Clock; color: string }[] = [
    { key: "pending", label: "Pending Review", count: counts.pending, icon: Clock, color: "text-amber-600" },
    { key: "approved", label: "Approved", count: counts.approved, icon: CheckCircle, color: "text-emerald-600" },
    { key: "resubmit", label: "Resubmit", count: counts.resubmit, icon: RefreshCw, color: "text-orange-500" },
    { key: "rejected", label: "Rejected", count: counts.rejected, icon: XCircle, color: "text-red-600" },
  ];

  const tabTitles: Record<Tab, { title: string; desc: string }> = {
    pending: { title: "KYC Queue", desc: "Review documents and approve or reject KYC submissions." },
    approved: { title: "Approved KYC", desc: "Partners with approved KYC. You can still reject or ask for resubmission." },
    resubmit: { title: "Awaiting Resubmission", desc: "Partners asked to resubmit documents. They will move to Pending once they upload again." },
    rejected: { title: "Rejected KYC", desc: "Permanently rejected submissions." },
  };

  const emptyStates: Record<Tab, { icon: typeof Clock; title: string; desc: string }> = {
    pending: { icon: ShieldCheck, title: "No pending KYC submissions", desc: "All caught up! No submissions awaiting review." },
    approved: { icon: CheckCircle, title: "No approved KYC yet", desc: "Approved submissions will appear here." },
    resubmit: { icon: RefreshCw, title: "No resubmissions pending", desc: "No partners are awaiting document resubmission." },
    rejected: { icon: XCircle, title: "No rejected KYC submissions", desc: "Rejected submissions will appear here." },
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "KYC Management" }]} />
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">KYC Management</h1>
        <p className="text-brand-muted">Review private partner documents, payout method, and bank or UPI eligibility.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Pending Review" value={counts.pending} icon={ShieldCheck} tone="amber" />
        <StatCard label="Approved KYC" value={counts.approved} icon={CheckCircle} tone="green" />
        <StatCard label="Resubmit Required" value={counts.resubmit} icon={RefreshCw} tone="amber" />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} tone="rose" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-brand-border overflow-x-auto">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-brand-muted hover:text-brand-ink"
            }`}
          >
            <t.icon className={`h-4 w-4 ${tab === t.key ? "text-brand-accent" : t.color}`} />
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              tab === t.key ? "bg-brand-accent/10 text-brand-accent" : "bg-slate-100 text-slate-600"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-brand-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">{tabTitles[tab].title}</h2>
            <p className="text-sm text-brand-muted">{tabTitles[tab].desc}</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, Partner ID, mobile..."
              className="w-full rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-accent sm:w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Payment Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Documents</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Submission</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-brand-muted">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState
                      icon={emptyStates[tab].icon}
                      title={emptyStates[tab].title}
                      description={emptyStates[tab].desc}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-brand-surface/30">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-brand-ink">{item.full_name || "Unknown"}</p>
                      <p className="font-mono text-xs text-brand-primaryDark">{item.partner?.partner_code || "-"}</p>
                      <p className="text-xs text-brand-muted">{item.email}</p>
                      <p className="text-xs text-brand-muted">{item.mobile_number}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted">
                      <Badge variant="info">{item.payment_method === "upi" ? "UPI" : "Bank"}</Badge>
                      {item.payment_method === "upi" ? (
                        <div className="mt-2 space-y-1">
                          <p className="font-medium text-brand-ink">{item.upi_holder_name || "-"}</p>
                          <p>UPI: {item.masked_upi_id || "-"}</p>
                          <p>Mobile: {item.upi_mobile || "-"}</p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          <p className="font-medium text-brand-ink">{item.account_holder_name || "-"}</p>
                          <p>{item.bank_name || "-"}</p>
                          <p>AC: {item.masked_account_number || "-"}</p>
                          <p>IFSC: {item.bank_ifsc || "-"}</p>
                          <p>Branch: {item.branch_name || "-"}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <DocLink href={item.pan_card_url} label="PAN" />
                        <DocLink href={item.aadhaar_front_url} label="Aadhaar Front" />
                        <DocLink href={item.aadhaar_back_url} label="Aadhaar Back" />
                        <DocLink href={item.selfie_url} label="Selfie" />
                        <DocLink href={item.cheque_url} label="Cheque/Passbook" optional={item.payment_method === "upi"} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted">
                      <p>Submitted: {item.created_at ? new Date(item.created_at).toLocaleString("en-IN") : "-"}</p>
                      <p>Updated: {item.updated_at ? new Date(item.updated_at).toLocaleString("en-IN") : "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadge(item.kyc_status) as any} dot>{String(item.kyc_status || "unknown").replace(/_/g, " ")}</Badge>
                      {(item.rejection_reason || item.resubmission_reason) && (
                        <p className="mt-2 max-w-[220px] text-xs text-red-600">{item.rejection_reason || item.resubmission_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[240px] space-y-2">
                        {/* Reason textarea — needed for reject/resubmit actions */}
                        {(tab === "pending" || tab === "approved") && (
                          <textarea
                            value={reason[item.id] || ""}
                            onChange={(e) => setReason((r) => ({ ...r, [item.id]: e.target.value }))}
                            placeholder="Reason (required for reject / resubmit)"
                            rows={2}
                            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                        )}

                        <div className="flex flex-wrap gap-2">
                          {/* PENDING: all actions */}
                          {tab === "pending" && (
                            <>
                              <ActionButton disabled={busy === item.id} onClick={() => { review(item.id, "under_review"); setReviewItem(item); }}>Start Review</ActionButton>
                              <ActionButton disabled={busy === item.id} onClick={() => review(item.id, "verified")}>Approve</ActionButton>
                              <ActionButton danger disabled={busy === item.id} onClick={() => review(item.id, "rejected")}>Reject</ActionButton>
                              <ActionButton warning disabled={busy === item.id} onClick={() => review(item.id, "resubmission_required")}>
                                <RotateCcw className="h-3 w-3" /> Resubmit
                              </ActionButton>
                            </>
                          )}

                          {/* APPROVED: can reject or ask resubmit */}
                          {tab === "approved" && (
                            <>
                              <ActionButton danger disabled={busy === item.id} onClick={() => review(item.id, "rejected")}>Reject</ActionButton>
                              <ActionButton warning disabled={busy === item.id} onClick={() => review(item.id, "resubmission_required")}>
                                <RotateCcw className="h-3 w-3" /> Ask Resubmit
                              </ActionButton>
                            </>
                          )}

                          {/* RESUBMIT: can approve if docs look ok, or reject */}
                          {tab === "resubmit" && (
                            <>
                              <ActionButton disabled={busy === item.id} onClick={() => review(item.id, "verified")}>Approve</ActionButton>
                              <ActionButton danger disabled={busy === item.id} onClick={() => review(item.id, "rejected")}>Reject</ActionButton>
                              <p className="w-full text-[10px] text-orange-600 italic">Waiting for partner to upload corrected documents.</p>
                            </>
                          )}

                          {/* REJECTED: can re-approve or move to resubmit */}
                          {tab === "rejected" && (
                            <>
                              <ActionButton disabled={busy === item.id} onClick={() => review(item.id, "verified")}>Re-approve</ActionButton>
                              <ActionButton warning disabled={busy === item.id} onClick={() => review(item.id, "resubmission_required")}>
                                <RotateCcw className="h-3 w-3" /> Ask Resubmit
                              </ActionButton>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {reviewItem && (
        <KycReviewDrawer
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onUpdated={() => void load()}
        />
      )}
    </div>
  );
}

function DocLink({ href, label, optional }: { href?: string | null; label: string; optional?: boolean }) {
  if (!href) return <span className={optional ? "text-slate-400" : "text-red-500"}>{label}: {optional ? "optional" : "missing"}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-brand-border bg-white px-3 py-2 font-medium text-brand-accent hover:bg-brand-surface">
      View {label}
    </a>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  danger,
  warning,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : warning
            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border-brand-border bg-brand-ink text-white hover:bg-brand-muted"
      }`}
    >
      {children}
    </button>
  );
}
