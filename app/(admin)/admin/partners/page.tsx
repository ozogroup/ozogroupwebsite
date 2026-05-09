"use client";

import { useState, useEffect } from "react";
import { getPartners, updatePartnerStatus, createPartner } from "@/lib/actions/partners";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    partner_name: "",
    partner_code: "",
    phone: "",
    email: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);

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
      setFormData({ partner_name: "", partner_code: "", phone: "", email: "", city: "" });
    } catch (error) {
      console.error("Error creating partner:", error);
      alert("Error creating partner");
    }
    setSaving(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-slate-100 text-slate-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">Referral Partners</h1>
          <p className="text-sm text-brand-muted">Manage referral partners</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
        >
          Add Partner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-surface/50 border-b border-brand-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Partner</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Code</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Phone</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">City</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">👥</span>
                    <p className="text-brand-muted">No partners found</p>
                  </div>
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 font-medium text-brand-ink">{partner.partner_name}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{partner.partner_code}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{partner.phone}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{partner.city}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(partner.status)}`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <select
                      value={partner.status}
                      onChange={(e) => handleUpdateStatus(partner.id, e.target.value)}
                      className="px-2 py-1.5 text-xs border border-brand-border rounded focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-soft max-w-lg w-full p-4 sm:p-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-ink mb-4">Add Partner</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Partner Name</label>
                <input
                  type="text"
                  required
                  value={formData.partner_name}
                  onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Partner Code</label>
                <input
                  type="text"
                  required
                  value={formData.partner_code}
                  onChange={(e) => setFormData({ ...formData, partner_code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
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
                  className="px-6 py-2.5 border border-brand-border text-brand-ink text-sm font-medium rounded-lg hover:bg-brand-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
