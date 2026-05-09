"use client";

import { useState, useEffect } from "react";
import { getContactSettings, updateContactSettings } from "@/lib/actions/contact";

export default function AdminContactSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    business_hours: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    linkedin_url: "",
    youtube_url: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const data = await getContactSettings();
    setSettings(data);
    if (data) {
      const settingsData = data as any;
      setFormData({
        phone: settingsData.phone || "",
        whatsapp: settingsData.whatsapp || "",
        email: settingsData.email || "",
        address: settingsData.address || "",
        business_hours: settingsData.business_hours || "",
        facebook_url: settingsData.facebook_url || "",
        instagram_url: settingsData.instagram_url || "",
        twitter_url: settingsData.twitter_url || "",
        linkedin_url: settingsData.linkedin_url || "",
        youtube_url: settingsData.youtube_url || "",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateContactSettings(formData);
      await loadSettings();
      alert("Contact settings saved successfully!");
    } catch (error) {
      console.error("Error saving contact settings:", error);
      alert("Error saving contact settings");
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
        <h1 className="font-display text-2xl font-bold text-brand-ink">Contact Settings</h1>
        <p className="text-sm text-brand-muted">Manage contact information displayed on the website</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-surface/50 border-b border-brand-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Phone Number</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">WhatsApp Number</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Email Address</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Address</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Business Hours</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
              <tr>
                <td className="px-4 sm:px-6 py-3 text-sm text-brand-ink">{formData.phone}</td>
                <td className="px-4 sm:px-6 py-3 text-sm text-brand-ink">{formData.whatsapp}</td>
                <td className="px-4 sm:px-6 py-3 text-sm text-brand-ink">{formData.email}</td>
                <td className="px-4 sm:px-6 py-3 text-sm text-brand-ink">{formData.address}</td>
                <td className="px-4 sm:px-6 py-3 text-sm text-brand-ink">{formData.business_hours}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div>
            <h3 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">📍</span>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-ink mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="contact@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-ink mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
                  rows={3}
                  placeholder="123 Beauty Street, Mumbai, Maharashtra 400001"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-ink mb-2">Business Hours</label>
                <input
                  type="text"
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="Mon - Sat: 10:00 AM - 7:00 PM"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-brand-border pt-8">
            <h3 className="font-display text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">🔗</span>
              Social Media Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Facebook URL</label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Instagram URL</label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Twitter URL</label>
                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://twitter.com/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://linkedin.com/company/yourpage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">YouTube URL</label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="https://youtube.com/yourchannel"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
