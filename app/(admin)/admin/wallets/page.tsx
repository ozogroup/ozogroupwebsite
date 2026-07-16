"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Users, Wallet, ChevronLeft, ChevronRight,
  Download, DollarSign, Clock, CheckCircle, Award,
  ShoppingBag, AlertCircle,
} from "lucide-react";
import { getAdminWalletDirectory } from "@/lib/actions/wallets";
import { Badge, Card, PageHeader, StatCard, EmptyState } from "@/components/admin/ui";

const PAGE_SIZE = 25;

function money(v: number | string | null | undefined) {
  return `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
}

function statusVariant(s?: string | null): "success" | "warning" | "danger" | "neutral" {
  if (s === "active") return "success";
  if (s === "pending" || s === "payment_pending") return "warning";
  if (s === "suspended" || s === "rejected") return "danger";
  return "neutral";
}

function exportCSV(rows: any[]) {
  const headers = [
    "Partner Name", "Partner ID", "Sponsor", "Status", "KYC",
    "Membership Reward", "L1 Income", "L2 Income", "L3 Income", "L4 Income",
    "Booking Commission", "Total Generated", "Pending Earnings", "Approved Earnings",
    "Wallet Balance", "Reserved Payout", "Paid Payout", "Lifetime Earnings",
    "Last Earning Date", "Last Payout Date",
  ];
  const data = rows.map((r) => [
    r.name, r.partner_code, r.sponsor_code || "", r.status, r.kyc_status || "",
    r.membershipReward, r.l1Income, r.l2Income, r.l3Income, r.l4Income,
    r.bookingCommission, r.totalGenerated, r.pendingEarnings, r.approvedEarnings,
    r.wallet_balance, r.reservedPayout, r.paidPayout, r.lifetime_earnings,
    r.lastEarningDate ? new Date(r.lastEarningDate).toLocaleDateString("en-IN") : "",
    r.lastPayoutDate ? new Date(r.lastPayoutDate).toLocaleDateString("en-IN") : "",
  ]);
  const csv = [headers, ...data].map((row) =>
    row.map((cell: any) => {
      const str = String(cell);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admin-wallets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminWalletsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("wallet_balance");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setRows(await getAdminWalletDirectory());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 25000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [load]);

  const filtered = useMemo(() => {
    let data = rows;
    if (statusFilter !== "all") data = data.filter((r) => r.status === statusFilter);
    const term = search.trim().toLowerCase();
    if (term) {
      data = data.filter((r) =>
        [r.name, r.partner_code, r.phone, r.email, r.sponsor_code, r.sponsor_name]
          .filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }
    return [...data].sort((a, b) => {
      const av = Number(a[sortField] || 0);
      const bv = Number(b[sortField] || 0);
      return sortAsc ? av - bv : bv - av;
    });
  }, [rows, search, statusFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cp = Math.min(page, totalPages);
  const paged = filtered.slice((cp - 1) * PAGE_SIZE, cp * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const totals = useMemo(() => {
    const sum = (key: string) => rows.reduce((s, r) => s + Number(r[key] || 0), 0);
    return {
      walletLiability: sum("wallet_balance"),
      totalGenerated: sum("totalGenerated"),
      pendingEarnings: sum("pendingEarnings"),
      approvedEarnings: sum("approvedEarnings"),
      reservedPayout: sum("reservedPayout"),
      paidPayout: sum("paidPayout"),
    };
  }, [rows]);

  function handleSort(field: string) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  }

  function SortTh({ field, children, right }: { field: string; children: React.ReactNode; right?: boolean }) {
    const active = sortField === field;
    return (
      <th
        className={`px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-brand-ink cursor-pointer select-none hover:text-brand-accent whitespace-nowrap ${right ? "text-right" : "text-left"}`}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-0.5">
          {children}
          {active && <span className="text-brand-accent">{sortAsc ? "▲" : "▼"}</span>}
        </span>
      </th>
    );
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
      <PageHeader
        title="Master Wallet View"
        description="Financial ledger for every partner — wallet balance, commission breakdown by level, and payout history."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Partners" value={rows.length} icon={Users} tone="sage" />
        <StatCard label="Total Wallet Liability" value={money(totals.walletLiability)} icon={Wallet} tone="amber" />
        <StatCard label="Total Generated" value={money(totals.totalGenerated)} icon={DollarSign} tone="green" />
        <StatCard label="Pending Earnings" value={money(totals.pendingEarnings)} icon={AlertCircle} tone="amber" />
        <StatCard label="Reserved Payout" value={money(totals.reservedPayout)} icon={Clock} tone="rose" />
        <StatCard label="Paid Payouts" value={money(totals.paidPayout)} icon={CheckCircle} tone="green" />
      </div>

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">All Partner Wallets</h2>
            <p className="text-sm text-brand-muted">{filtered.length} partner{filtered.length !== 1 ? "s" : ""} — click column headers to sort.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-accent"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, phone..."
                className="w-full rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-accent sm:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-ink hover:border-brand-accent hover:text-brand-accent"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[2200px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">Partner</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">Sponsor</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">Status</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">KYC</th>
                <SortTh field="membershipReward" right>Memb. Reward</SortTh>
                <SortTh field="l1Income" right>L1 Income</SortTh>
                <SortTh field="l2Income" right>L2 Income</SortTh>
                <SortTh field="l3Income" right>L3 Income</SortTh>
                <SortTh field="l4Income" right>L4 Income</SortTh>
                <SortTh field="bookingCommission" right>Booking Comm.</SortTh>
                <SortTh field="totalGenerated" right>Total Gen.</SortTh>
                <SortTh field="pendingEarnings" right>Pending</SortTh>
                <SortTh field="approvedEarnings" right>Approved</SortTh>
                <SortTh field="wallet_balance" right>Wallet</SortTh>
                <SortTh field="reservedPayout" right>Reserved</SortTh>
                <SortTh field="paidPayout" right>Paid</SortTh>
                <SortTh field="lifetime_earnings" right>Lifetime</SortTh>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">Last Earning</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">Last Payout</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-6 py-12">
                    <EmptyState icon={Wallet} title="No partners found" description="Try a different search or filter." />
                  </td>
                </tr>
              ) : paged.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-brand-surface/30">
                  <td className="px-3 py-3">
                    <p className="font-medium text-brand-ink text-sm">{r.name}</p>
                    <p className="font-mono text-[10px] font-semibold text-brand-primaryDark">{r.partner_code}</p>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-brand-muted">
                    {r.sponsor_name ? (
                      <div>
                        <p className="text-brand-ink">{r.sponsor_name}</p>
                        <p className="font-mono text-[10px]">{r.sponsor_code}</p>
                      </div>
                    ) : <span>Root</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={statusVariant(r.status)} dot>{r.status || "unknown"}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={r.kyc_status === "verified" ? "success" : r.kyc_status === "pending" ? "warning" : "neutral"}>
                      {r.kyc_status || "N/A"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right text-sm">{r.membershipReward ? money(r.membershipReward) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm">{r.l1Income ? money(r.l1Income) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm">{r.l2Income ? money(r.l2Income) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm">{r.l3Income ? money(r.l3Income) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm">{r.l4Income ? money(r.l4Income) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm">{r.bookingCommission ? money(r.bookingCommission) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm font-medium text-brand-ink">{r.totalGenerated ? money(r.totalGenerated) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm text-amber-600">{r.pendingEarnings ? money(r.pendingEarnings) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm text-blue-600">{r.approvedEarnings ? money(r.approvedEarnings) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-brand-ink">{money(r.wallet_balance)}</td>
                  <td className="px-3 py-3 text-right text-sm text-brand-muted">{r.reservedPayout ? money(r.reservedPayout) : "---"}</td>
                  <td className="px-3 py-3 text-right text-sm text-brand-muted">{r.paidPayout ? money(r.paidPayout) : "---"}</td>
                  <td className="px-3 py-3 text-right text-sm font-medium text-brand-ink">{r.lifetime_earnings ? money(r.lifetime_earnings) : <span className="text-brand-muted">---</span>}</td>
                  <td className="px-3 py-3 text-[11px] text-brand-muted whitespace-nowrap">
                    {r.lastEarningDate ? new Date(r.lastEarningDate).toLocaleDateString("en-IN") : "---"}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-brand-muted whitespace-nowrap">
                    {r.lastPayoutDate ? new Date(r.lastPayoutDate).toLocaleDateString("en-IN") : "---"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <a
                        href="/admin/commissions"
                        title="View Ledger"
                        className="rounded-lg border border-brand-border p-1.5 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href="/admin/payouts"
                        title="View Payout History"
                        className="rounded-lg border border-brand-border p-1.5 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-brand-border px-4 py-3">
            <p className="text-sm text-brand-muted">
              Showing {(cp - 1) * PAGE_SIZE + 1}&ndash;{Math.min(cp * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cp <= 1} className="rounded-lg border border-brand-border p-2 text-brand-muted hover:text-brand-ink disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-brand-ink">Page {cp} of {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={cp >= totalPages} className="rounded-lg border border-brand-border p-2 text-brand-muted hover:text-brand-ink disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
