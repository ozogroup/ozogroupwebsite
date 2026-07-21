"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search, ShieldCheck, FileText, CheckCircle, XCircle, RotateCcw, Clock, Filter } from "lucide-react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { getKycSubmissions, reviewKycSubmission } from "@/lib/actions/kyc";
import { Badge, Card, EmptyState, StatCard } from "@/components/admin/ui";
import KycReviewDrawer from "@/components/admin/KycReviewDrawer";

type KycRow = any;
type Tab = "pending" | "approved" | "rejected";

function statusBadge(status: string) {
  if (status === "verified" || status === "approved") return "success";
  if (status === "rejected" || status === "resubmission_required") return "danger";
  if (status === "pending" || status === "under_review") return "warning";
  return "neutral";
}

const isPending = (s: string) => ["pending", "under_review"].includes(s);
const isApproved = (s: string) => ["verified", "approved"].includes(s);
const isRejected = (s: string) => ["rejected", "resubmission_required"].includes(s);

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
    pending: items.filter((i) => isPending(i.kyc_status)).length,
    approved: items.filter((i) => isApproved(i.kyc_status)).length,
    rejected: items.filter((i) => isRejected(i.kyc_status)).length,
    missing: items.filter((i) => !i.documents?.pan || !i.documents?.aadhaar_front || !i.documents?.selfie).length,
  }), [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTab =
        tab === "pending" ? isPending(item.kyc_status) :
        tab === "approved" ? isApproved(item.kyc_status) :
        isRejected(item.kyc_status);
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
    { key: "rejected", label: "Rejected", count: counts.rejected, icon: XCircle, color: "text-red-600" },
  ];

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
        <StatCard label="Rejected / Resubmit" value={counts.rejected} icon={XCircle} tone="rose" />
        <StatCard label="Missing Document" value={counts.missing} icon={FileText} tone="slate" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-brand-border">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
            <h2 className="font-display text-lg font-semibold text-brand-ink">
              {tab === "pending" ? "KYC Queue" : tab === "approved" ? "Approved KYC" : "Rejected KYC"}
            </h2>
            <p className="text-sm text-brand-muted">
              {tab === "pending"
                ? "Review documents and approve or reject KYC submissions."
                : tab === "approved"
                  ? "Partners with approved KYC verification."
                  : "Rejected submissions. Partners can resubmit after correction."}
            </p>
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
                {tab === "pending" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Decision</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={tab === "pending" ? 6 : 5} className="px-4 py-12 text-center text-brand-muted">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={tab === "pending" ? 6 : 5} className="px-6 py-12">
                    <EmptyState
                      icon={tab === "pending" ? ShieldCheck : tab === "approved" ? CheckCircle : XCircle}
                      title={
                        tab === "pending" ? "No pending KYC submissions"
                        : tab === "approved" ? "No approved KYC yet"
                        : "No rejected KYC submissions"
                      }
                      description={
                        tab === "pending" ? "All caught up! No submissions awaiting review."
                        : tab === "approved" ? "Approved submissions will appear here."
                        : "Rejected submissions will appear here."
                      }
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
                    {tab === "pending" && (
                      <td className="px-4 py-4">
                        <div className="min-w-[260px] space-y-2">
                          <textarea
                            value={reason[item.id] || ""}
                            onChange={(e) => setReason((r) => ({ ...r, [item.id]: e.target.value }))}
                            placeholder="Reason required for reject/resubmission"
                            rows={2}
                            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-accent"
                          />
                          <div className="flex flex-wrap gap-2">
                            <ActionButton disabled={busy === item.id} onClick={() => { review(item.id, "under_review"); setReviewItem(item); }}>Start Review</ActionButton>
                            <ActionButton disabled={busy === item.id} onClick={() => review(item.id, "verified")}>Approve</ActionButton>
                            <ActionButton danger disabled={busy === item.id} onClick={() => review(item.id, "rejected")}>Reject</ActionButton>
                            <ActionButton warning disabled={busy === item.id} onClick={() => review(item.id, "resubmission_required")}>
                              <RotateCcw className="h-3 w-3" /> Resubmit
                            </ActionButton>
                          </div>
                        </div>
                      </td>
                    )}
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
