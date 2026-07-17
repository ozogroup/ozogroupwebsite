"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Wallet, ChevronLeft, ChevronRight, DollarSign,
  Clock, CheckCircle, AlertCircle, Users, Download, FileText, Printer,
} from "lucide-react";
import { adminCreatePayoutForPartner, getPayouts, updatePayoutStatus } from "@/lib/actions/payouts";
import { getAdminWalletDirectory } from "@/lib/actions/wallets";
import { Badge, Card, PageHeader, StatCard, EmptyState } from "@/components/admin/ui";

const PAGE_SIZE = 20;

function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function profileName(value: any) {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.full_name || "Unknown";
}

function getStatusColor(status: string) {
  switch (status) {
    case "requested": return "bg-yellow-100 text-yellow-700";
    case "approved": return "bg-blue-100 text-blue-700";
    case "processing": return "bg-brand-light text-brand-primaryDark";
    case "paid": return "bg-emerald-100 text-emerald-700";
    case "rejected": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [walletPartners, setWalletPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"wallets" | "requests">("wallets");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [pageA, setPageA] = useState(1);
  const [pageB, setPageB] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const loadAll = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const [payoutData, walletData] = await Promise.all([
      getPayouts(),
      getAdminWalletDirectory(),
    ]);
    // Filter to real payout rows only (no synthetic)
    setPayouts(payoutData.filter((p: any) => !p.is_summary));
    setWalletPartners(walletData);
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  useEffect(() => {
    const refresh = () => void loadAll(false);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 25000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [loadAll]);

  async function handleUpdateStatus(id: string, status: string) {
    if (status === "paid") {
      const reference = refs[id]?.trim();
      if (!reference) {
        alert("Enter UTR / transaction reference before marking paid.");
        return;
      }
      if (!window.confirm("Final settlement: mark this payout as paid and update partner wallet/dashboard?")) return;
    }
    setBusy(id);
    try {
      await updatePayoutStatus(id, status, refs[id], notes[id]);
      await loadAll(false);
    } catch (error: any) {
      alert(error?.message || "Error updating payout status");
    } finally {
      setBusy(null);
    }
  }

  async function handleBulkStatus(status: "approved" | "processing" | "paid" | "rejected") {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (ids.length === 0) {
      alert("Select payout rows first.");
      return;
    }
    const reference = status === "paid" ? window.prompt("Enter common UTR / transaction reference for selected payouts:") : "";
    if (status === "paid" && !reference?.trim()) return;
    const note = window.prompt("Optional admin note:", notes[ids[0]] || "") || "";
    if (!window.confirm(`Apply "${status}" to ${ids.length} selected payout(s)?`)) return;
    setBusy("bulk");
    try {
      for (const id of ids) {
        await updatePayoutStatus(id, status, status === "paid" ? reference || "" : refs[id], note || notes[id]);
      }
      setSelected({});
      await loadAll(false);
    } catch (error: any) {
      alert(error?.message || "Bulk payout update failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreatePayoutForPartner(partner: any) {
    const walletBalance = Number(partner.wallet_balance || 0);
    const input = window.prompt(
      `Create a payout request for ${partner.name || partner.partner_code || "this partner"}.\n\nAmount to pay out (Rs.), max ${walletBalance.toLocaleString("en-IN")}:`,
      String(walletBalance)
    );
    if (input == null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }

    setBusy(partner.id);
    try {
      const result = await adminCreatePayoutForPartner(partner.id, amount);
      if (result.error) {
        alert(result.error);
      } else {
        await loadAll(false);
      }
    } catch (error: any) {
      alert(error?.message || "Unable to create payout for this partner.");
    } finally {
      setBusy(null);
    }
  }

  // Section A: wallet liability
  const filteredWallets = useMemo(() => {
    const term = searchA.trim().toLowerCase();
    let data = walletPartners;
    if (term) {
      data = data.filter((r) =>
        [r.name, r.partner_code, r.phone, r.sponsor_code].filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }
    return data.sort((a, b) => Number(b.wallet_balance || 0) - Number(a.wallet_balance || 0));
  }, [walletPartners, searchA]);

  const totalPagesA = Math.max(1, Math.ceil(filteredWallets.length / PAGE_SIZE));
  const cpA = Math.min(pageA, totalPagesA);
  const pagedWallets = filteredWallets.slice((cpA - 1) * PAGE_SIZE, cpA * PAGE_SIZE);
  useEffect(() => { setPageA(1); }, [searchA]);

  // Section B: actual payout requests
  const filteredPayouts = useMemo(() => {
    const term = searchB.trim().toLowerCase();
    let data = payouts;
    if (term) {
      data = data.filter((p: any) =>
        [profileName(p.partner?.profiles), p.partner?.partner_code].filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }
    return data;
  }, [payouts, searchB]);

  const totalPagesB = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE));
  const cpB = Math.min(pageB, totalPagesB);
  const pagedPayouts = filteredPayouts.slice((cpB - 1) * PAGE_SIZE, cpB * PAGE_SIZE);
  useEffect(() => { setPageB(1); }, [searchB]);
  const selectablePagedPayouts = pagedPayouts.filter((p: any) => p.selectable);
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const exportIds = selectedIds.length > 0 ? selectedIds : filteredPayouts.filter((p: any) => p.selectable).map((p: any) => p.id);
  const exportQuery = exportIds.map((id) => `id=${encodeURIComponent(id)}`).join("&");

  // Summary stats
  const totalWalletLiability = walletPartners.reduce((s, r) => s + Number(r.wallet_balance || 0), 0);
  const requestedTotal = payouts.filter((p: any) => ["requested", "processing"].includes(p.status)).reduce((s: number, p: any) => s + Number(p.gross_amount || p.amount || 0), 0);
  const paidTotal = payouts.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const partnersWithBalance = walletPartners.filter((r) => Number(r.wallet_balance || 0) > 0).length;

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
        title="Payouts"
        description="Section A shows all partner wallets (available liability). Section B shows actual payout requests from the database."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Wallet Liability" value={money(totalWalletLiability)} icon={Wallet} tone="amber" hint={`${partnersWithBalance} partners with balance`} />
        <StatCard label="Requested / Processing" value={money(requestedTotal)} icon={Clock} tone="rose" hint={`${payouts.filter((p: any) => ["requested", "processing"].includes(p.status)).length} requests`} />
        <StatCard label="Paid Payouts" value={money(paidTotal)} icon={CheckCircle} tone="green" hint={`${payouts.filter((p: any) => p.status === "paid").length} completed`} />
        <StatCard label="Total Partners" value={walletPartners.length} icon={Users} tone="sage" />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("wallets")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${tab === "wallets" ? "bg-brand-ink text-white" : "bg-brand-surface text-brand-muted hover:bg-brand-light"}`}
        >
          Section A: All Partner Wallets ({partnersWithBalance} with balance)
        </button>
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${tab === "requests" ? "bg-brand-ink text-white" : "bg-brand-surface text-brand-muted hover:bg-brand-light"}`}
        >
          Section B: Payout Requests ({payouts.length})
        </button>
      </div>

      {/* ── SECTION A: WALLET LIABILITY ── */}
      {tab === "wallets" && (
        <Card noPadding>
          <div className="flex flex-col gap-3 border-b border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-ink">All Partner Wallets — Available Liability</h2>
              <p className="text-sm text-brand-muted">Every partner wallet including Rs. 0 balances. 15% deduction shown for reference.</p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
                placeholder="Search name, ID, phone..."
                className="w-full rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-accent sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="border-b border-brand-border bg-brand-surface/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Partner</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Gross Wallet</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">15% Deduction</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Net Payable</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">KYC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Reserved</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border bg-white">
                {pagedWallets.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12"><EmptyState icon={Wallet} title="No partners found" description="Try a different search." /></td></tr>
                ) : pagedWallets.map((r) => {
                  const wallet = Number(r.wallet_balance || 0);
                  const deduction = Math.round(wallet * 0.15 * 100) / 100;
                  const net = Math.round((wallet - deduction) * 100) / 100;
                  return (
                    <tr key={r.id} className="hover:bg-brand-surface/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-ink text-sm">{r.name}</p>
                        <p className="font-mono text-[10px] font-semibold text-brand-primaryDark">{r.partner_code}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-brand-ink">{money(wallet)}</td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">-{money(deduction)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-brand-ink">{money(net)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.kyc_status === "verified" ? "success" : r.kyc_status === "pending" ? "warning" : "neutral"}>
                          {r.kyc_status || "N/A"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "active" ? "success" : r.status === "pending" ? "warning" : "neutral"} dot>
                          {r.status || "unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-brand-muted">{r.reservedPayout ? money(r.reservedPayout) : "---"}</td>
                      <td className="px-4 py-3 text-right text-sm text-brand-muted">{r.paidPayout ? money(r.paidPayout) : "---"}</td>
                      <td className="px-4 py-3">
                        {wallet > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleCreatePayoutForPartner(r)}
                            disabled={busy === r.id}
                            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink hover:border-brand-accent hover:text-brand-accent disabled:opacity-50"
                          >
                            {busy === r.id ? "Creating..." : "Create Payout"}
                          </button>
                        ) : (
                          <span className="text-xs text-brand-muted">No balance</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPagesA > 1 && (
            <div className="flex items-center justify-between border-t border-brand-border px-4 py-3">
              <p className="text-sm text-brand-muted">Showing {(cpA - 1) * PAGE_SIZE + 1}&ndash;{Math.min(cpA * PAGE_SIZE, filteredWallets.length)} of {filteredWallets.length}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPageA((p) => Math.max(1, p - 1))} disabled={cpA <= 1} className="rounded-lg border border-brand-border p-2 text-brand-muted hover:text-brand-ink disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm font-medium text-brand-ink">Page {cpA} of {totalPagesA}</span>
                <button type="button" onClick={() => setPageA((p) => Math.min(totalPagesA, p + 1))} disabled={cpA >= totalPagesA} className="rounded-lg border border-brand-border p-2 text-brand-muted hover:text-brand-ink disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── SECTION B: ACTUAL PAYOUT REQUESTS ── */}
      {tab === "requests" && (
        <Card noPadding>
          <div className="flex flex-col gap-3 border-b border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-ink">Payout Requests</h2>
              <p className="text-sm text-brand-muted">Only real database payout rows. Approve, reject, or mark as paid.</p>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  placeholder="Search partner..."
                  className="w-full rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-accent sm:w-64"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`/api/admin/payouts/export?format=csv&${exportQuery}`} className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-accent">
                  <Download className="h-3.5 w-3.5" /> CSV
                </a>
                <a href={`/api/admin/payouts/export?format=xlsx&${exportQuery}`} className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-accent">
                  <Download className="h-3.5 w-3.5" /> Excel
                </a>
                <a href={`/api/admin/payouts/export?format=pdf&${exportQuery}`} className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-accent">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </a>
                <button type="button" onClick={() => window.open(`/api/admin/payouts/export?format=print&${exportQuery}`, "_blank")} className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-accent">
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-brand-border bg-brand-surface/40 px-4 py-3 text-xs">
            <span className="font-medium text-brand-ink">{selectedIds.length} selected</span>
            <button type="button" onClick={() => handleBulkStatus("approved")} disabled={busy === "bulk" || selectedIds.length === 0} className="rounded-lg bg-white px-3 py-1.5 text-brand-ink ring-1 ring-brand-border disabled:opacity-50">Bulk approve</button>
            <button type="button" onClick={() => handleBulkStatus("processing")} disabled={busy === "bulk" || selectedIds.length === 0} className="rounded-lg bg-white px-3 py-1.5 text-brand-ink ring-1 ring-brand-border disabled:opacity-50">Mark processing</button>
            <button type="button" onClick={() => handleBulkStatus("paid")} disabled={busy === "bulk" || selectedIds.length === 0} className="rounded-lg bg-brand-ink px-3 py-1.5 text-white disabled:opacity-50">Mark paid</button>
            <button type="button" onClick={() => handleBulkStatus("rejected")} disabled={busy === "bulk" || selectedIds.length === 0} className="rounded-lg bg-red-50 px-3 py-1.5 text-red-700 ring-1 ring-red-100 disabled:opacity-50">Reject</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-brand-surface/50 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    <input
                      type="checkbox"
                      checked={selectablePagedPayouts.length > 0 && selectablePagedPayouts.every((p: any) => selected[p.id])}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSelected((prev) => {
                          const next = { ...prev };
                          for (const payout of selectablePagedPayouts) next[payout.id] = checked;
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Partner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Gross Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">15% Deduction</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Net Payable</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Breakup</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Bank / UPI</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Requested</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {pagedPayouts.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-12"><EmptyState icon={DollarSign} title="No payout requests" description="Payout requests from partners or admin-created payouts will appear here." /></td></tr>
                ) : pagedPayouts.map((payout: any) => (
                  <tr key={payout.id} className="align-top hover:bg-brand-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[payout.id])}
                        disabled={!payout.selectable}
                        title={payout.selection_block_reason || "Select payout"}
                        onChange={(event) => setSelected((prev) => ({ ...prev, [payout.id]: event.target.checked }))}
                      />
                      {!payout.selectable && <p className="mt-1 max-w-[120px] text-[10px] text-brand-muted">{payout.selection_block_reason}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-brand-ink">{profileName(payout.partner?.profiles)}</p>
                      <p className="text-xs text-brand-muted font-mono">{payout.partner?.partner_code || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p className="font-semibold text-brand-ink">{money(payout.gross_amount || payout.amount)}</p>
                      <div className="mt-1 text-xs text-brand-muted">
                        <p>Membership: {money(payout.partner_summary?.membershipIncome)}</p>
                        <p>Bookings: {money(payout.partner_summary?.productIncome)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-red-600">
                      <p className="font-semibold">-{money(payout.deduction_amount)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p className="font-semibold text-brand-ink">{money(payout.net_amount || payout.amount)}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted min-w-[240px]">
                      {payout.partner_summary?.membershipSummary?.length || payout.partner_summary?.kitSummary?.length ? (
                        <div className="space-y-2">
                          {payout.partner_summary?.membershipSummary?.map((item: any) => (
                            <div key={`${item.membershipId}-${item.memberName}`} className="rounded-lg border border-brand-border bg-green-50/60 p-2">
                              <p className="font-semibold text-brand-ink">Referral Rs. 500</p>
                              <p>{item.memberName} | L{item.level} | {item.status}</p>
                            </div>
                          ))}
                          {payout.partner_summary?.kitSummary?.map((item: any) => (
                            <div key={item.kitName} className="rounded-lg border border-brand-border bg-brand-surface/40 p-2">
                              <p className="font-semibold text-brand-ink">{item.kitName}</p>
                              <p>Comm: {money(item.commissionAmount)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No commission details</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted max-w-xs">
                      <p>{payout.payment_details || "-"}</p>
                      <p className="mt-1 text-xs">Method: {payout.payment_method || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted whitespace-nowrap">
                      {payout.created_at ? new Date(payout.created_at).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2 min-w-[240px]">
                        <input
                          value={refs[payout.id] || payout.transaction_reference || ""}
                          onChange={(e) => setRefs((r) => ({ ...r, [payout.id]: e.target.value }))}
                          placeholder="Transaction/reference ID"
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <textarea
                          value={notes[payout.id] || payout.transaction_note || ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [payout.id]: e.target.value }))}
                          placeholder="Admin note"
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <select
                          value={payout.status}
                          disabled={busy === payout.id}
                          onChange={(e) => handleUpdateStatus(payout.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none disabled:opacity-50"
                        >
                          <option value="requested">Requested</option>
                          <option value="approved">Approved</option>
                          <option value="processing">Approve / Processing</option>
                          <option value="paid">Mark Paid</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPagesB > 1 && (
            <div className="flex items-center justify-between border-t border-brand-border px-4 py-3">
              <p className="text-sm text-brand-muted">Showing {(cpB - 1) * PAGE_SIZE + 1}&ndash;{Math.min(cpB * PAGE_SIZE, filteredPayouts.length)} of {filteredPayouts.length}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPageB((p) => Math.max(1, p - 1))} disabled={cpB <= 1} className="rounded-lg border border-brand-border p-2 text-brand-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm font-medium text-brand-ink">Page {cpB} of {totalPagesB}</span>
                <button type="button" onClick={() => setPageB((p) => Math.min(totalPagesB, p + 1))} disabled={cpB >= totalPagesB} className="rounded-lg border border-brand-border p-2 text-brand-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
