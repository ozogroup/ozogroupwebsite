"use client";

import { useState, useEffect } from "react";
import { getCommissionLevels, searchPartner, getReferralTree } from "@/lib/actions/referrals";

export default function AdminReferralsPage() {
  const [commissionLevels, setCommissionLevels] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadCommissionLevels();
  }, []);

  async function loadCommissionLevels() {
    setLoading(true);
    const data = await getCommissionLevels();
    setCommissionLevels(data);
    setLoading(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    const results = await searchPartner(searchQuery);
    setSearchResults(results);
    setSearching(false);
  }

  async function handleViewTree(partner: any) {
    setSelectedPartner(partner);
    const tree = await getReferralTree(partner.id);
    setReferralTree(tree);
  }

  function handleBack() {
    setSelectedPartner(null);
    setReferralTree(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (selectedPartner && referralTree) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-brand-muted hover:text-brand-ink transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-ink">
              {selectedPartner.profiles?.full_name}
            </h1>
            <p className="text-sm text-brand-muted">
              Partner ID: {selectedPartner.partner_code} • {referralTree.totalReferrals} total referrals
            </p>
          </div>
        </div>

        {/* Referral Tree */}
        <div className="bg-white rounded-xl shadow-soft border border-brand-border p-6">
          <h2 className="font-display text-lg font-semibold text-brand-ink mb-6 flex items-center gap-2">
            <span className="text-xl">🌳</span>
            Referral Tree
          </h2>

          <div className="space-y-6">
            {Object.entries(referralTree.tree).map(([level, partners]: [string, any]) => (
              <div key={level}>
                <h3 className="font-medium text-brand-ink mb-3">Level {level}</h3>
                <div className="bg-brand-surface rounded-lg p-4">
                  {partners.length === 0 ? (
                    <p className="text-sm text-brand-muted">No referrals at this level</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {partners.map((partner: any) => (
                        <div
                          key={partner.id}
                          className="bg-white rounded-lg p-4 border border-brand-border"
                        >
                          <p className="font-medium text-brand-ink">{partner.profiles?.full_name}</p>
                          <p className="text-xs text-brand-muted">{partner.partner_code}</p>
                          <p className="text-xs text-brand-muted">{partner.city}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              partner.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'
                            }`}>
                              {partner.status}
                            </span>
                            <span className="text-xs text-brand-muted">
                              ₹{partner.wallet_balance?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Referral System</h1>
        <p className="text-sm text-brand-muted">View referral hierarchy and commission levels</p>
      </div>

      {/* Commission Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <h3 className="font-display text-lg font-semibold text-brand-ink mb-2">Level 1</h3>
          <p className="text-3xl font-bold text-brand-accent">{commissionLevels?.level_1_percentage || 6}%</p>
          <p className="text-sm text-brand-muted mt-1">Direct referrals</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <h3 className="font-display text-lg font-semibold text-brand-ink mb-2">Level 2</h3>
          <p className="text-3xl font-bold text-brand-accent">{commissionLevels?.level_2_percentage || 3}%</p>
          <p className="text-sm text-brand-muted mt-1">Second level</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <h3 className="font-display text-lg font-semibold text-brand-ink mb-2">Level 3</h3>
          <p className="text-3xl font-bold text-brand-accent">{commissionLevels?.level_3_percentage || 1.7}%</p>
          <p className="text-sm text-brand-muted mt-1">Third level</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <h3 className="font-display text-lg font-semibold text-brand-ink mb-2">Level 4</h3>
          <p className="text-3xl font-bold text-brand-accent">{commissionLevels?.level_4_percentage || 1.2}%</p>
          <p className="text-sm text-brand-muted mt-1">Fourth level</p>
        </div>
      </div>

      {/* Search Partner */}
      <div className="bg-white rounded-xl shadow-soft border border-brand-border p-6">
        <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
          <span className="text-xl">🔍</span>
          Search Partner
        </h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter partner ID or phone"
            className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-brand-muted">Search Results</h3>
            {searchResults.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 bg-brand-surface rounded-lg border border-brand-border hover:border-brand-accent transition-colors"
              >
                <div>
                  <p className="font-medium text-brand-ink">{partner.profiles?.full_name}</p>
                  <p className="text-xs text-brand-muted">
                    {partner.partner_code} • {partner.profiles?.phone}
                  </p>
                </div>
                <button
                  onClick={() => handleViewTree(partner)}
                  className="px-4 py-2 text-sm text-brand-accent hover:underline"
                >
                  View Tree
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl shadow-soft border border-brand-border p-12 text-center">
        <span className="text-5xl mb-4 block">🌳</span>
        <p className="text-brand-muted">Search for a partner to view their referral tree</p>
      </div>
    </div>
  );
}
