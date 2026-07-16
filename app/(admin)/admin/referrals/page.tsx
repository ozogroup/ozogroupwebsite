"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Network, Search, Users, GitBranch, UserCheck, Link2,
  DollarSign, Wallet, CreditCard, Clock, CheckCircle,
  Download, ChevronLeft, ChevronRight, Award, ShoppingBag,
  AlertCircle, Layers,
} from "lucide-react";
import { getAllPartnersDirectory, getReferralOverview, getReferralTree, getReferralNetworkSummary } from "@/lib/actions/referrals";
import { Badge, Card, PageHeader, StatCard, EmptyState } from "@/components/admin/ui";

const PAGE_SIZE = 25;

function money(value: number | string | null | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function statusVariant(status?: string | null): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "pending":
    case "payment_pending":
    case "pending_payment":
      return "warning";
    case "suspended":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

function partnerName(partner: any) {
  const p = Array.isArray(partner?.profiles) ? partner.profiles[0] : partner?.profiles;
  return p?.full_name || partner?.full_name || "Unnamed Partner";
}

function partnerPhone(partner: any) {
  const p = Array.isArray(partner?.profiles) ? partner.profiles[0] : partner?.profiles;
  return p?.phone || partner?.phone || "-";
}

function partnerEmail(partner: any) {
  const p = Array.isArray(partner?.profiles) ? partner.profiles[0] : partner?.profiles;
  return p?.email || partner?.email || "-";
}

function PartnerCard({ partner, onView }: { partner: any; onView: (partner: any) => void }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-brand-ink">{partnerName(partner)}</p>
          <p className="mt-1 font-mono text-xs text-brand-muted">{partner.partner_code || "-"}</p>
          <p className="mt-1 text-xs text-brand-muted">{partnerPhone(partner)}</p>
        </div>
        <Badge variant={statusVariant(partner.status)} dot>{partner.status || "unknown"}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-3 text-xs text-brand-muted">
        <span>{partner.city || "City not set"}</span>
        <span>{money(partner.wallet_balance)}</span>
      </div>
      <button
        type="button"
        onClick={() => onView(partner)}
        className="mt-4 w-full rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-ink transition-colors hover:border-brand-accent hover:text-brand-accent"
      >
        View 4-Level Tree
      </button>
    </div>
  );
}

function exportCSV(directory: any[], earningsByPartner: Record<string, any>) {
  const headers = [
    "Partner Name", "Partner ID", "Mobile", "Email", "City",
    "Sponsor Name", "Sponsor ID", "Direct Referrals", "Total Team",
    "Membership Rewards", "Booking Commissions", "Current Wallet",
    "Reserved Payout", "Paid Payout", "KYC Status", "Status", "Join Date",
  ];
  const rows = directory.map((p) => {
    const earnings = earningsByPartner[p.id] || {};
    return [
      partnerName(p),
      p.partner_code || "",
      partnerPhone(p),
      partnerEmail(p),
      p.city || "",
      p.sponsor ? partnerName(p.sponsor) : "",
      p.sponsor?.partner_code || "",
      p.directTeamCount,
      p.totalTeamCount,
      earnings.membershipRewards || 0,
      earnings.bookingCommissions || 0,
      p.wallet_balance || 0,
      earnings.reservedPayout || 0,
      earnings.paidPayout || 0,
      p.kyc_status || "not_submitted",
      p.status || "unknown",
      p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "",
    ];
  });

  const csv = [headers, ...rows].map((row) =>
    row.map((cell: any) => {
      const str = String(cell);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `referral-network-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReferralsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const commissionLevels = overview?.commissionLevels;

  const levelRates = useMemo(
    () => [
      { level: 1, rate: commissionLevels?.level_1_percentage || 6, label: "Direct sponsor payout" },
      { level: 2, rate: commissionLevels?.level_2_percentage || 3, label: "Second level payout" },
      { level: 3, rate: commissionLevels?.level_3_percentage || 1.7, label: "Third level payout" },
      { level: 4, rate: commissionLevels?.level_4_percentage || 1.2, label: "Fourth level payout" },
    ],
    [commissionLevels],
  );

  const earningsByPartner = summary?.earningsByPartner || {};

  const loadAll = useCallback(async () => {
    try {
      const [overviewData, directoryData, summaryData] = await Promise.all([
        getReferralOverview(),
        getAllPartnersDirectory(),
        getReferralNetworkSummary(),
      ]);
      setOverview(overviewData);
      setDirectory(directoryData);
      setSummary(summaryData);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Unable to load referral network.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSelectedTree = useCallback(async () => {
    if (!selectedPartner?.id) return;
    try {
      const tree = await getReferralTree(selectedPartner.id);
      setReferralTree(tree);
    } catch (err: any) {
      setError(err?.message || "Unable to refresh referral tree.");
    }
  }, [selectedPartner?.id]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onFocus = () => {
      void loadAll();
      void refreshSelectedTree();
    };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(onFocus, 25000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [loadAll, refreshSelectedTree]);

  async function handleViewTree(partner: any) {
    setSelectedPartner(partner);
    setTreeLoading(true);
    setError(null);
    try {
      const tree = await getReferralTree(partner.id);
      setReferralTree(tree);
    } catch (err: any) {
      setError(err?.message || "Unable to load referral tree.");
      setReferralTree(null);
    } finally {
      setTreeLoading(false);
    }
  }

  function handleBack() {
    setSelectedPartner(null);
    setReferralTree(null);
  }

  const filteredDirectory = useMemo(() => {
    let rows = directory;
    if (levelFilter !== "all") {
      rows = rows.filter((p) => (levelFilter === 4 ? p.levelFromRoot >= 4 : p.levelFromRoot === levelFilter));
    }
    if (statusFilter !== "all") {
      rows = rows.filter((p) => p.status === statusFilter);
    }
    const term = directorySearch.trim().toLowerCase();
    if (term) {
      rows = rows.filter((p) =>
        [p.partner_code, partnerName(p), partnerPhone(p), partnerEmail(p), p.sponsor?.partner_code, partnerName(p.sponsor), p.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }
    return rows;
  }, [directory, directorySearch, levelFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDirectory.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedDirectory = filteredDirectory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [directorySearch, levelFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  if (selectedPartner) {
    const tree = referralTree?.tree || {};
    const partnerEarnings = earningsByPartner[selectedPartner.id] || {};
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink"
          >
            &larr; Back to all accounts
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-ink">{partnerName(selectedPartner)}</h1>
            <p className="text-sm text-brand-muted">
              Partner ID: {selectedPartner.partner_code || "-"} | {referralTree?.totalReferrals || 0} active tree members
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Wallet Balance" value={money(selectedPartner.wallet_balance)} icon={Wallet} tone="green" />
          <StatCard label="Total Earnings" value={money(selectedPartner.total_earnings)} icon={DollarSign} tone="sage" />
          <StatCard label="Membership Rewards" value={money(partnerEarnings.membershipRewards)} icon={Award} tone="purple" />
          <StatCard label="Booking Commissions" value={money(partnerEarnings.bookingCommissions)} icon={ShoppingBag} tone="teal" />
          <StatCard label="Reserved Payout" value={money(partnerEarnings.reservedPayout)} icon={Clock} tone="amber" />
          <StatCard label="Paid Payout" value={money(partnerEarnings.paidPayout)} icon={CheckCircle} tone="green" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {levelRates.map((item) => (
            <div key={item.level} className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-brand-ink">Level {item.level}</p>
              <p className="mt-2 text-3xl font-bold text-brand-accent">{item.rate}%</p>
              <p className="mt-1 text-xs text-brand-muted">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-brand-ink">{(tree[item.level] || []).length} partners</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-ink">Referral Tree</h2>
              <p className="text-sm text-brand-muted">Hierarchy stops at Level 4. No Level 5 commission is generated.</p>
            </div>
            <button
              type="button"
              onClick={refreshSelectedTree}
              disabled={treeLoading}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-ink hover:border-brand-accent disabled:opacity-60"
            >
              {treeLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="space-y-5">
            {[1, 2, 3, 4].map((level) => {
              const partners = tree[level] || [];
              return (
                <div key={level} className="rounded-lg border border-brand-border bg-brand-surface/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-brand-ink">Level {level}</h3>
                    <span className="text-sm text-brand-muted">{partners.length} partners</span>
                  </div>
                  {partners.length === 0 ? (
                    <p className="rounded-lg bg-white px-4 py-3 text-sm text-brand-muted">No referrals at this level</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {partners.map((partner: any) => (
                        <PartnerCard key={partner.id} partner={partner} onView={handleViewTree} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {referralTree?.pendingMembers?.length > 0 && (
          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-brand-ink">Pending Members</h2>
            <p className="mt-1 text-sm text-brand-muted">These memberships are still visible under the sponsor until approval.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {referralTree.pendingMembers.map((member: any) => (
                <div key={member.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="font-medium text-brand-ink">{member.full_name || "Pending member"}</p>
                  <p className="mt-1 text-xs text-brand-muted">{member.mobile || "-"}</p>
                  <p className="text-xs text-brand-muted">{member.city || "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="warning">{member.membership_status || "pending"}</Badge>
                    <Badge variant="warning">{member.payment_status || "payment pending"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const totals = overview?.totals || {};
  const lc = summary?.levelCounts || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Network"
        description="Every business account, who referred them, and their 4-level commission eligibility — in one place."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Partner counts */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Partners" value={totals.partners || 0} icon={Users} tone="sage" />
        <StatCard label="Active Partners" value={totals.activePartners || 0} icon={UserCheck} tone="green" />
        <StatCard label="Pending Partners" value={summary?.pendingPartners || 0} icon={AlertCircle} tone="amber" />
        <StatCard label="Level 1 Partners" value={lc[1] || 0} icon={Layers} tone="purple" hint="Direct referral links" />
        <StatCard label="Level 2 Partners" value={lc[2] || 0} icon={Layers} tone="teal" hint="2nd-degree links" />
        <StatCard label="Level 3-4 Partners" value={(lc[3] || 0) + (lc[4] || 0)} icon={Layers} tone="slate" hint="3rd + 4th degree links" />
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Membership Rewards"
          value={money(summary?.totalMembershipRewardLiability)}
          icon={Award}
          tone="green"
          hint={`${summary?.membershipRewardsGenerated || 0} rewards generated`}
        />
        <StatCard
          label="Booking Commissions"
          value={money(summary?.totalBookingCommissionLiability)}
          icon={ShoppingBag}
          tone="purple"
          hint={`${summary?.bookingCommissionsGenerated || 0} commissions generated`}
        />
        <StatCard
          label="Total Wallet Liability"
          value={money(summary?.totalWalletLiability)}
          icon={Wallet}
          tone="amber"
          hint="Sum of all partner wallets"
        />
        <StatCard
          label="Pending Payout"
          value={money(summary?.pendingPayoutLiability)}
          icon={Clock}
          tone="rose"
          hint="Requested + processing"
        />
        <StatCard
          label="Paid Payouts"
          value={money(summary?.paidPayouts)}
          icon={CheckCircle}
          tone="green"
          hint="Successfully disbursed"
        />
      </div>

      {/* Commission level rates */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {levelRates.map((item) => (
          <div key={item.level} className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-brand-ink">Level {item.level}</p>
              <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand-primaryDark">
                {lc[item.level] || 0} links
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-brand-accent">{item.rate}%</p>
            <p className="mt-1 text-sm text-brand-muted">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Directory table */}
      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">All Business Accounts</h2>
            <p className="text-sm text-brand-muted">
              {filteredDirectory.length} partner{filteredDirectory.length !== 1 ? "s" : ""} found, sorted by biggest full team first.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={levelFilter === "all" ? "all" : String(levelFilter)}
              onChange={(e) => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent"
            >
              <option value="all">All levels</option>
              <option value="0">Root (no sponsor)</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4+</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search ID, name, phone, sponsor..."
                className="w-full rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-brand-accent focus:ring-2 focus:ring-brand-accent sm:w-72"
              />
            </div>
            <button
              type="button"
              onClick={() => exportCSV(filteredDirectory, earningsByPartner)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-ink transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Partner (ID)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Mobile / Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Sponsor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Direct</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Team</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">City</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink">Membership Rewards</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink">Booking Comm.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink">Wallet</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink">Reserved</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">KYC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {pagedDirectory.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-6 py-12">
                    <EmptyState icon={Users} title="No accounts found" description="Try a different search or filter." />
                  </td>
                </tr>
              ) : (
                pagedDirectory.map((partner) => {
                  const earnings = earningsByPartner[partner.id] || {};
                  return (
                    <tr key={partner.id} className="transition-colors hover:bg-brand-surface/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-semibold text-white">
                            {partnerName(partner)[0]}
                          </div>
                          <div>
                            <p className="font-medium text-brand-ink text-sm">{partnerName(partner)}</p>
                            <p className="mt-0.5 font-mono text-xs font-semibold text-brand-primaryDark">{partner.partner_code || "---"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        <p>{partnerPhone(partner)}</p>
                        <p className="mt-0.5 truncate max-w-[140px]">{partnerEmail(partner)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {partner.sponsor ? (
                          <div className="flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
                            <div>
                              <p className="text-brand-ink text-xs">{partnerName(partner.sponsor)}</p>
                              <p className="font-mono text-xs text-brand-muted">{partner.sponsor.partner_code}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-muted">Root</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-muted">
                        {partner.levelFromRoot === 0 ? "Root" : `L${partner.levelFromRoot}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-muted">{partner.directTeamCount}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-light/60 px-2.5 py-1 text-sm font-semibold text-brand-primaryDark">
                          {partner.totalTeamCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">{partner.city || "---"}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-brand-ink">
                        {earnings.membershipRewards ? money(earnings.membershipRewards) : <span className="text-brand-muted">---</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-brand-ink">
                        {earnings.bookingCommissions ? money(earnings.bookingCommissions) : <span className="text-brand-muted">---</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-brand-ink">{money(partner.wallet_balance)}</td>
                      <td className="px-4 py-3 text-right text-sm text-brand-muted">
                        {earnings.reservedPayout ? money(earnings.reservedPayout) : "---"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-brand-muted">
                        {earnings.paidPayout ? money(earnings.paidPayout) : "---"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={partner.kyc_status === "verified" ? "success" : partner.kyc_status === "pending" ? "warning" : "neutral"}>
                          {partner.kyc_status || "N/A"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(partner.status)} dot>{partner.status || "unknown"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted whitespace-nowrap">
                        {partner.created_at ? new Date(partner.created_at).toLocaleDateString("en-IN") : "---"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleViewTree(partner)}
                          className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:border-brand-accent hover:text-brand-accent"
                        >
                          View Tree
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-brand-border px-4 py-3">
            <p className="text-sm text-brand-muted">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDirectory.length)} of {filteredDirectory.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-brand-border p-2 text-brand-muted transition-colors hover:text-brand-ink disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-brand-ink">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-brand-border p-2 text-brand-muted transition-colors hover:text-brand-ink disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
