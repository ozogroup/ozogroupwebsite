"use client";

import { useState, useEffect } from "react";
import { getCommissionSettings, updateCommissionSettings } from "@/lib/actions/commission-settings";
import { getSystemSettings, updateSystemSettings } from "@/lib/actions/system-settings";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [commissionSettings, setCommissionSettings] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [contactData, setContactData] = useState({
    contactNumber: "",
    whatsappNumber: "",
    email: "",
    address: "",
    instagram: "",
    facebook: "",
    youtube: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const [commission, system] = await Promise.all([
      getCommissionSettings(),
      getSystemSettings(),
    ]);
    setCommissionSettings(commission);
    setSystemSettings(system);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("level_1_percentage", commissionSettings.level_1_percentage.toString());
      formData.append("level_2_percentage", commissionSettings.level_2_percentage.toString());
      formData.append("level_3_percentage", commissionSettings.level_3_percentage.toString());
      formData.append("level_4_percentage", commissionSettings.level_4_percentage.toString());

      const commissionResult = await updateCommissionSettings(formData);
      if (commissionResult.error) {
        setSaveError(commissionResult.error);
        setSaving(false);
        return;
      }

      const systemFormData = new FormData();
      systemFormData.append("maintenance_mode", systemSettings.maintenance_mode.toString());
      systemFormData.append("payouts_enabled", systemSettings.payouts_enabled.toString());
      systemFormData.append("commissions_enabled", systemSettings.commissions_enabled.toString());
      systemFormData.append("bookings_enabled", systemSettings.bookings_enabled.toString());
      systemFormData.append("membership_enabled", systemSettings.membership_enabled.toString());

      const systemResult = await updateSystemSettings(systemFormData);
      if (systemResult.error) {
        setSaveError(systemResult.error);
        setSaving(false);
        return;
      }

      await loadSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveError("Error saving settings");
    }

    setSaving(false);
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
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Settings</h1>
        <p className="text-sm text-brand-muted">Configure application settings</p>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-green-600">✓</span>
          <p className="text-sm text-green-700">Settings saved successfully!</p>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-red-600">✕</span>
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
            <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">📞</span>
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Contact Number</label>
                <input
                  type="text"
                  value={contactData.contactNumber}
                  onChange={(e) => setContactData({ ...contactData, contactNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="+91 12345 67890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={contactData.whatsappNumber}
                  onChange={(e) => setContactData({ ...contactData, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="+91 12345 67890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Email</label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="contact@kiaskincare.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Address</label>
                <textarea
                  value={contactData.address}
                  onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Enter address"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
            <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">🔗</span>
              Social Links
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Instagram</label>
                <input
                  type="url"
                  value={contactData.instagram}
                  onChange={(e) => setContactData({ ...contactData, instagram: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://instagram.com/kia_skincare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Facebook</label>
                <input
                  type="url"
                  value={contactData.facebook}
                  onChange={(e) => setContactData({ ...contactData, facebook: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://facebook.com/kia-skincare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">YouTube</label>
                <input
                  type="url"
                  value={contactData.youtube}
                  onChange={(e) => setContactData({ ...contactData, youtube: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://youtube.com/@kia-skincare"
                />
              </div>
            </div>
          </div>

          {/* Referral Settings */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
            <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">💰</span>
              Referral Commission Rates (%)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Level 1 Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionSettings?.level_1_percentage || 6}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, level_1_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Level 2 Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionSettings?.level_2_percentage || 3}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, level_2_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Level 3 Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionSettings?.level_3_percentage || 1.7}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, level_3_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Level 4 Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionSettings?.level_4_percentage || 1.2}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, level_4_percentage: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
            <h2 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              System Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-ink">Maintenance Mode</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={systemSettings?.maintenance_mode || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, maintenance_mode: e.target.checked })}
                    className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
                  />
                  <span className="text-sm text-brand-muted">Enable</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-ink">Payouts Enabled</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={systemSettings?.payouts_enabled || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, payouts_enabled: e.target.checked })}
                    className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
                  />
                  <span className="text-sm text-brand-muted">Enable</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-ink">Commissions Enabled</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={systemSettings?.commissions_enabled || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, commissions_enabled: e.target.checked })}
                    className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
                  />
                  <span className="text-sm text-brand-muted">Enable</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-ink">Bookings Enabled</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={systemSettings?.bookings_enabled || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, bookings_enabled: e.target.checked })}
                    className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
                  />
                  <span className="text-sm text-brand-muted">Enable</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-ink">Membership Enabled</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={systemSettings?.membership_enabled || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, membership_enabled: e.target.checked })}
                    className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
                  />
                  <span className="text-sm text-brand-muted">Enable</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
