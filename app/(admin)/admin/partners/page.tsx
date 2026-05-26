"use client";

import { useState, useEffect } from "react";
import { getPartners, updatePartnerStatus, createPartner } from "@/lib/actions/partners";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { getReferralUrl } from "@/lib/referral-url";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    partner_name: "",
    phone: "",
    email: "",
    city: "",
    commission_rate: "",
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    setLoading(true);
    const data = await getPartners();
    setPartners(data);
    setLoading(false);
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await updatePartnerStatus(id, status);
      await loadPartners();
    } catch (error) {
      console.error("Error updating partner status:", error);
      alert("Error updating partner status");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPartner(formData);
      await loadPartners();
      setShowModal(false);
      setFormData({ partner_name: "", phone: "", email: "", city: "", commission_rate: "" });
    } catch (error) {
      console.error("Error creating partner:", error);
      alert("Error creating partner");
    }
    setSaving(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "inactive":
        return "bg-slate-100 text-slate-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function getReferralLink(partnerCode: string) {
    return getReferralUrl(partnerCode);
  }

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.partner_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalEarnings = partners.reduce((acc, p) => acc + (p.total_earnings || 0), 0);
  const activePartners = partners.filter(p => p.status === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Partner Program" }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referral Partners</h1>
          <p className="text-slate-600 mt-1">Manage referral partners and commissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Partner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Partners</p>
          <p className="text-2xl font-bold text-slate-900">{partners.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active Partners</p>
          <p className="text-2xl font-bold text-emerald-600">{activePartners}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-slate-900">₹{totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold text-amber-600">₹{partners.reduce((acc, p) => acc + (p.wallet_balance || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search partners by name, code, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Partner</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Partner ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">City</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Earnings</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
            {filteredPartners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-5xl">👥</span>
                    <p className="text-slate-600 font-medium">No partners found</p>
                    <p className="text-sm text-slate-500">Add your first partner to get started</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
                    >
                      Add Partner
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{partner.profiles?.full_name || "—"}</p>
                      <p className="text-xs text-slate-500">{partner.profiles?.email || partner.profiles?.phone || "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{partner.partner_code}</code>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">{partner.city}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">₹{(partner.total_earnings || 0).toLocaleString()}</p>
                      <p className="text-xs text-amber-600">Pending: ₹{(partner.pending_payout || 0).toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(partner.status)}`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-slate-600 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <select
                        value={partner.status}
                        onChange={(e) => handleUpdateStatus(partner.id, e.target.value)}
                        className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Partner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add Partner</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
                <p className="text-sm font-medium text-brand-ink">Partner ID</p>
                <p className="mt-1 text-sm text-brand-muted">Generated automatically in the KIA1001 format when the partner is created.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="City name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="e.g., 10"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Partner"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Detail Modal */}
      {showDetailModal && selectedPartner && (
        <div className="fixed inset-0 bg-brand-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedPartner.profiles?.full_name || "—"}</h2>
                  <p className="text-sm text-slate-500 mt-1">Partner ID: <code className="bg-slate-100 px-2 py-0.5 rounded">{selectedPartner.partner_code}</code></p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Total Earnings</p>
                  <p className="text-xl font-bold text-slate-900">₹{(selectedPartner.total_earnings || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Wallet Balance</p>
                  <p className="text-xl font-bold text-amber-600">₹{(selectedPartner.wallet_balance || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Paid Earnings</p>
                  <p className="text-xl font-bold text-slate-900">₹{(selectedPartner.paid_earnings || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Referral Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getReferralLink(selectedPartner.partner_code)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getReferralLink(selectedPartner.partner_code));
                      alert("Link copied to clipboard!");
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Phone</p>
                    <p className="font-medium text-slate-900">{selectedPartner.profiles?.phone || "Not provided"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Email</p>
                    <p className="font-medium text-slate-900">{selectedPartner.profiles?.email || "Not provided"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">City</p>
                    <p className="font-medium text-slate-900">{selectedPartner.city || "Not provided"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-600 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPartner.status)}`}>
                      {selectedPartner.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Share */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">WhatsApp Share</h3>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Join KIA Skin Care Partner Program! Use my Partner ID: ${selectedPartner.partner_code}\n${getReferralLink(selectedPartner.partner_code)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52.075-.149.669-1.612.916-2.207.242-.579.072-1.054.077-1.054.077-.446.052-1.232.26-1.935.644-.705.384-1.85 1.23-1.85 2.608 0 1.378 1.015 2.228 1.158 2.416.143.188 2.006 3.061 4.862 4.297 2.857 1.236 3.436 1.008 4.045.946.612-.064 1.975-.807 2.25-1.584.278-.79.278-1.468.197-1.615.474-.149.724-.734 1.008-1.09.273-.357.724-.267 1.008-.173.285.094 1.8.846 2.108 1.008.307.162.669.198.865.149.198-.05.724-.298 1.008-.598.284-.299.724-.734.724-.734.464-.646.724-1.488.724-1.488-.074-.149-.464-.597-1.108-.823-.447-.167-1.05-.258-1.658-.262-.548-.004-1.356.05-2.073.367-.717.317-1.469.892-1.469 2.206 0 1.314 1.067 2.228 1.158 2.416.143.188 2.006 3.061 4.862 4.297 2.857 1.236 3.436 1.008 4.045.946.612-.064 1.975-.807 2.25-1.584.278-.79.278-1.468.197-1.615.474-.149.724-.734 1.008-1.09.273-.357.724-.267 1.008-.173.285.094 1.8.846 2.108 1.008.307.162.669.198.865.149.198-.05.724-.298 1.008-.598.284-.299.724-.734.724-.734.464-.646.724-1.488.724-1.488-.074-.149-.464-.597-1.108-.823z"/>
                  </svg>
                  Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
