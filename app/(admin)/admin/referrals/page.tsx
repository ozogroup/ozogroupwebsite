"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Network, Search, Users, GitBranch, UserCheck, Link2 } from "lucide-react";
import { getAllPartnersDirectory, getReferralOverview, getReferralTree } from "@/lib/actions/referrals";
import { Badge, Card, PageHeader, StatCard, EmptyState } from "@/components/admin/ui";

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
  return partner?.profiles?.full_name || partner?.full_name || "Unnamed Partner";
}

function partnerPhone(partner: any) {
  return partner?.profiles?.phone || partner?.phone || "-";
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

export default function AdminReferralsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commissionLevels = overview?.commissionLevels;
  const totals = overview?.totals || {};

  const levelRates = useMemo(
    () => [
      { level: 1, rate: commissionLevels?.level_1_percentage || 6, label: "Direct sponsor payout" },
      { level: 2, rate: commissionLevels?.level_2_percentage || 3, label: "Second level payout" },
      { level: 3, rate: commissionLevels?.level_3_percentage || 1.7, label: "Third level payout" },
      { level: 4, rate: commissionLevels?.level_4_percentage || 1.2, label: "Fourth level payout" },
    ],
    [commissionLevels],
  );

  const loadAll = useCallback(async () => {
    try {
      const [overviewData, directoryData] = await Promise.all([
        getReferralOverview(),
        getAllPartnersDirectory(),
      ]);
      setOverview(overviewData);
      setDirectory(directoryData);
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
    const term = directorySearch.trim().toLowerCase();
    if (term) {
      rows = rows.filter((p) =>
        [p.partner_code, partnerName(p), partnerPhone(p), p.sponsor?.partner_code, partnerName(p.sponsor), p.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }
    return rows;
  }, [directory, directorySearch, levelFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  if (selectedPartner) {
    const tree = referralTree?.tree || {};
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink"
          >
            ← Back to all accounts
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {levelRates.map((item) => (
            <div key={item.level} className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-brand-ink">Level {item.level}</p>
              <p className="mt-2 text-3xl font-bold text-brand-accent">{item.rate}%</p>
              <p className="mt-1 text-xs text-brand-muted">{item.label}</p>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral Network"
        description="Every business account, who referred them, and their 4-level commission eligibility — in one place."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Accounts" value={totals.partners || 0} icon={Users} tone="sage" />
        <StatCard label="Active Accounts" value={totals.activePartners || 0} icon={UserCheck} tone="green" />
        <StatCard label="Pending Members" value={totals.pendingMembers || 0} icon={Network} tone="amber" />
        <StatCard label="Sponsor Links" value={totals.treeLinks || 0} icon={GitBranch} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {levelRates.map((item) => (
          <div key={item.level} className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
            <p className="font-display text-lg font-semibold text-brand-ink">Level {item.level}</p>
            <p className="mt-2 text-3xl font-bold text-brand-accent">{item.rate}%</p>
            <p className="mt-1 text-sm text-brand-muted">{item.label}</p>
          </div>
        ))}
      </div>

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">All Business Accounts</h2>
            <p className="text-sm text-brand-muted">
              Every partner account, sorted by biggest full team first (Total Team = every level below them, Direct = only people they personally referred).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Account (Member ID)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Referred By (Sponsor)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Total Team ▾</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Direct</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {filteredDirectory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12">
                    <EmptyState icon={Users} title="No accounts found" description="Try a different search or level filter." />
                  </td>
                </tr>
              ) : (
                filteredDirectory.map((partner) => (
                  <tr key={partner.id} className="transition-colors hover:bg-brand-surface/30">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-semibold text-white">
                          {partnerName(partner)[0]}
                        </div>
                        <div>
                          <p className="font-medium text-brand-ink">{partnerName(partner)}</p>
                          <p className="mt-0.5 font-mono text-xs font-semibold text-brand-primaryDark">{partner.partner_code || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm sm:px-6">
                      {partner.sponsor ? (
                        <div className="flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
                          <div>
                            <p className="text-brand-ink">{partnerName(partner.sponsor)}</p>
                            <p className="font-mono text-xs text-brand-muted">{partner.sponsor.partner_code}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">Root account (no sponsor)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      {partner.levelFromRoot === 0 ? "Root" : `L${partner.levelFromRoot}`}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className="rounded-full bg-brand-light/60 px-2.5 py-1 text-sm font-semibold text-brand-primaryDark">
                        {partner.totalTeamCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{partner.directTeamCount}</td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{partner.city || "—"}</td>
                    <td className="px-4 py-4 text-sm font-medium text-brand-ink sm:px-6">{money(partner.wallet_balance)}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <Badge variant={statusVariant(partner.status)} dot>{partner.status || "unknown"}</Badge>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <button
                        type="button"
                        onClick={() => handleViewTree(partner)}
                        className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:border-brand-accent hover:text-brand-accent"
                      >
                        View Tree
                      </button>
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
