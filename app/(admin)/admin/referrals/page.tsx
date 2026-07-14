"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getReferralOverview, getReferralTree, searchPartner } from "@/lib/actions/referrals";

function money(value: number | string | null | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function statusClass(status?: string | null) {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700";
    case "pending":
    case "payment_pending":
    case "pending_payment":
      return "bg-amber-50 text-amber-700";
    case "suspended":
    case "rejected":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-50 text-slate-700";
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
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(partner.status)}`}>
          {partner.status || "unknown"}
        </span>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
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

  const loadOverview = useCallback(async () => {
    try {
      const data = await getReferralOverview();
      setOverview(data);
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
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const onFocus = () => {
      void loadOverview();
      void refreshSelectedTree();
    };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(onFocus, 25000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [loadOverview, refreshSelectedTree]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const results = await searchPartner(term);
      setSearchResults(results);
    } catch (err: any) {
      setError(err?.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

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
            Back
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
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700">
                      {member.membership_status || "pending"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700">
                      {member.payment_status || "payment pending"}
                    </span>
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
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Referral Network</h1>
        <p className="text-sm text-brand-muted">Track sponsor chains, pending members and 4-level commission eligibility.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-brand-muted">Total Partners</p>
          <p className="mt-2 text-3xl font-bold text-brand-ink">{totals.partners || 0}</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-brand-muted">Active Partners</p>
          <p className="mt-2 text-3xl font-bold text-brand-ink">{totals.activePartners || 0}</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-brand-muted">Pending Members</p>
          <p className="mt-2 text-3xl font-bold text-brand-ink">{totals.pendingMembers || 0}</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
          <p className="text-sm font-medium text-brand-muted">Tree Links</p>
          <p className="mt-2 text-3xl font-bold text-brand-ink">{totals.treeLinks || 0}</p>
        </div>
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

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-brand-ink">Search Partner</h2>
        <p className="mt-1 text-sm text-brand-muted">Search by Partner ID, phone, email or name.</p>
        <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="KIA1001, phone, email or name"
            className="flex-1 rounded-lg border border-brand-border px-4 py-2.5 outline-none transition-all focus:border-brand-accent focus:ring-2 focus:ring-brand-accent"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-gradient-to-r from-brand-ink to-brand-muted px-6 py-2.5 text-sm font-medium text-white transition-all hover:shadow-glow disabled:opacity-60"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchQuery.trim() && !searching && searchResults.length === 0 && (
          <p className="mt-4 rounded-lg bg-brand-surface px-4 py-3 text-sm text-brand-muted">No partner found for this search.</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {searchResults.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} onView={handleViewTree} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-brand-ink">Recent Partners</h2>
            <p className="text-sm text-brand-muted">Open any partner to inspect their direct and 4-level team.</p>
          </div>
          <button
            type="button"
            onClick={loadOverview}
            className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-ink hover:border-brand-accent"
          >
            Refresh
          </button>
        </div>
        {(overview?.recentPartners || []).length === 0 ? (
          <p className="rounded-lg bg-brand-surface px-4 py-8 text-center text-brand-muted">No partner records found yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview.recentPartners.map((partner: any) => (
              <PartnerCard key={partner.id} partner={partner} onView={handleViewTree} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
