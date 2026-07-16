"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Wallet, Clock, CheckCircle2, BadgeIndianRupee } from "lucide-react";
import {
  generateMissingBookingCommissions,
  generateMissingMembershipReferralCommissions,
  getCommissions,
  updateCommissionStatus,
} from "@/lib/actions/commissions";
import { Badge, Card, PageHeader, StatCard, EmptyState } from "@/components/admin/ui";

function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function statusVariant(status: string): "warning" | "info" | "success" | "danger" | "neutral" {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "info";
    case "paid":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

function allowedStatuses(status: string) {
  if (status === "pending") return ["pending", "approved", "rejected"];
  if (status === "approved") return ["approved", "rejected"];
  return [status];
}

function profileName(value: any) {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.full_name || "Unknown";
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingMemberships, setGeneratingMemberships] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "paid" | "rejected">("all");
  const [search, setSearch] = useState("");

  const loadCommissions = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const data = await getCommissions();
    setCommissions(data);
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    void loadCommissions();
  }, [loadCommissions]);

  useEffect(() => {
    const refresh = () => void loadCommissions(false);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 25000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [loadCommissions]);

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await updateCommissionStatus(id, status);
      await loadCommissions(false);
    } catch (error: any) {
      console.error("Error updating commission status:", error);
      alert(error?.message || "Error updating commission status");
    }
  }

  async function handleGenerateMissing() {
    setGenerating(true);
    setMessage(null);
    try {
      const result = await generateMissingBookingCommissions();
      await loadCommissions(false);
      setMessage(`Checked ${result.scanned} eligible bookings and generated any missing 4-level commission rows.`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to generate missing commissions.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateMissingMemberships() {
    setGeneratingMemberships(true);
    setMessage(null);
    try {
      const result = await generateMissingMembershipReferralCommissions();
      await loadCommissions(false);
      setMessage(`Checked ${result.scanned} paid active memberships and created ${result.created} missing Rs. ${Number(result.bonusAmount).toLocaleString("en-IN")} referral commission rows.`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to generate missing referral commissions.");
    } finally {
      setGeneratingMemberships(false);
    }
  }

  const summary = useMemo(() => {
    const pending = commissions.filter((c) => c.status === "pending");
    const approved = commissions.filter((c) => c.status === "approved");
    const paid = commissions.filter((c) => c.status === "paid");
    const sum = (rows: any[]) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    return {
      pendingCount: pending.length,
      pendingAmount: sum(pending),
      approvedAmount: sum(approved),
      paidAmount: sum(paid),
      total: commissions.length,
    };
  }, [commissions]);

  const visibleCommissions = useMemo(() => {
    let rows = commissions;
    if (filter !== "all") rows = rows.filter((c) => c.status === filter);
    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter((c) => {
        const haystack = [
          c.partner?.partner_code,
          profileName(c.partner?.profiles),
          c.source_booking?.customer_name,
          c.source_booking?.booking_id,
          c.source_membership?.full_name,
          c.source_membership?.membership_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
    }
    return rows;
  }, [commissions, filter, search]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Every partner's earnings, traced from source (booking or new member) to payout status."
        actions={
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerateMissingMemberships}
            disabled={generatingMemberships}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm font-medium text-brand-ink transition-all hover:border-brand-accent disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${generatingMemberships ? "animate-spin" : ""}`} />
            {generatingMemberships ? "Checking..." : "Generate Missing Referral Rs. 500"}
          </button>
          <button
            type="button"
            onClick={handleGenerateMissing}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-ink to-brand-muted px-4 py-2.5 text-sm font-medium text-white transition-all hover:shadow-glow disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Checking..." : "Generate Missing Booking Commissions"}
          </button>
          </div>
        }
      />

      {message && (
        <div className="rounded-lg border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted shadow-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Pending Approval" value={money(summary.pendingAmount)} icon={Clock} tone="amber" hint={`${summary.pendingCount} commission${summary.pendingCount === 1 ? "" : "s"}`} />
        <StatCard label="Approved (Unpaid)" value={money(summary.approvedAmount)} icon={BadgeIndianRupee} tone="purple" hint="Waiting in payout queue" />
        <StatCard label="Paid Out" value={money(summary.paidAmount)} icon={CheckCircle2} tone="green" hint="Settled to partners" />
        <StatCard label="Total Records" value={summary.total} icon={Wallet} tone="sage" hint="All commission rows" />
      </div>

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "approved", "paid", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === tab
                    ? "bg-brand-ink text-white"
                    : "bg-brand-surface text-brand-muted hover:bg-brand-light"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partner ID, member name..."
            className="w-full rounded-lg border border-brand-border px-3.5 py-2 text-sm outline-none transition-all focus:border-brand-accent focus:ring-2 focus:ring-brand-accent sm:w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Earning Partner (Member ID)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Earned From (Who Was Added)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Source Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Commission</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {visibleCommissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12">
                    <EmptyState icon={Wallet} title="No commissions found" description="Try a different filter or search term." />
                  </td>
                </tr>
              ) : (
                visibleCommissions.map((commission) => (
                  <tr key={commission.id} className="transition-colors hover:bg-brand-surface/30">
                    <td className="px-4 py-4 font-medium text-brand-ink sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-semibold text-white">
                          {(profileName(commission.partner?.profiles) || "P")[0]}
                        </div>
                        <div>
                          <p>{profileName(commission.partner?.profiles)}</p>
                          <p className="mt-0.5 font-mono text-xs font-semibold text-brand-primaryDark">
                            {commission.partner?.partner_code || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      {commission.source_type === "booking" && commission.source_booking ? (
                        <div>
                          <p className="font-medium text-brand-ink">{commission.source_booking.customer_name || "-"}</p>
                          <p className="text-xs">{commission.source_booking.treatment_name || "-"}</p>
                          <p className="font-mono text-xs">Booking {commission.source_booking.booking_id || commission.source_id}</p>
                        </div>
                      ) : commission.source_type === "membership" && commission.source_membership ? (
                        <div>
                          <p className="font-medium text-brand-ink">{commission.source_membership.full_name || "-"}</p>
                          <p className="text-xs">New member sign-up</p>
                          <p className="font-mono text-xs">Membership {commission.source_membership.membership_id || commission.source_id}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="capitalize">{commission.source_type || "unknown"}</p>
                          <p className="font-mono text-xs">{commission.source_id || "-"}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">L{commission.level}</td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      {commission.source_type === "membership" ? "Flat" : `${Number(commission.percentage || 0)}%`}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      {money(commission.source_amount || commission.source_booking?.payment_amount || commission.source_booking?.treatment_price || 0)}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-brand-ink sm:px-6">{money(commission.amount)}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <Badge variant={statusVariant(commission.status)} dot>
                        {commission.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      <p>Created: {commission.created_at ? new Date(commission.created_at).toLocaleDateString("en-IN") : "-"}</p>
                      <p>Paid: {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString("en-IN") : "-"}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <select
                        value={commission.status}
                        onChange={(event) => handleUpdateStatus(commission.id, event.target.value)}
                        className="rounded border border-brand-border px-2 py-1.5 text-xs outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent"
                      >
                        {allowedStatuses(commission.status).map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
