"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminContactSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    business_hours: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
  });

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data, error } = await supabase.from("contact_settings" as any).select("*").single();
    
    if (error) {
      console.error("Error loading contact settings:", error);
      // Auto-create if missing
      await createDefaultSettings();
    } else if (data) {
      const settingsData = data as any;
      setSettings(settingsData);
      setFormData({
        phone: settingsData.phone || "",
        whatsapp: settingsData.whatsapp || settingsData.whatsapp_number || settingsData.whatsapp_url || "",
        email: settingsData.email || "",
        address: settingsData.address || "",
        business_hours: settingsData.business_hours || "",
        facebook_url: settingsData.facebook_url || "",
        instagram_url: settingsData.instagram_url || "",
        youtube_url: settingsData.youtube_url || "",
      });
    }
    setLoading(false);
  }

  async function createDefaultSettings() {
    const defaultData = {
      phone: "+91 76986 17054",
      whatsapp: "+91 76986 17054",
      email: "contact@ia-skincare.com",
      address: "OZO Group, IA Skin Care Division, Ahmedabad, Gujarat",
      business_hours: "Mon - Sat: 10 AM - 7 PM",
      facebook_url: "",
      instagram_url: "",
      youtube_url: "",
    };

    const { data, error } = await (supabase as any).from("contact_settings").insert(defaultData).select().single();
    
    if (error) {
      console.error("Error creating default settings:", error);
      setError("Failed to create default contact settings");
    } else if (data) {
      setSettings(data);
      setFormData(defaultData);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const data = {
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        address: formData.address,
        business_hours: formData.business_hours,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        youtube_url: formData.youtube_url,
      };

      if (settings) {
        const { error } = await (supabase as any).from("contact_settings").update(data).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("contact_settings").insert(data);
        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadSettings();
    } catch (err: any) {
      setError(err.message || "Failed to save contact settings");
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Contact Settings</h1>
        <p className="text-brand-muted">Manage contact information displayed on the website</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
          Contact settings saved successfully!
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <form onSubmit={handleSave} className="space-y-6 p-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">📍</span>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="+91 98765 43210 or https://wa.me/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-ink mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="contact@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-ink mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                  rows={3}
                  placeholder="123 Beauty Street, Mumbai, Maharashtra 400001"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-ink mb-1">Business Hours</label>
                <input
                  type="text"
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="Mon - Sat: 10 AM - 7 PM"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <span className="text-xl">🔗</span>
              Social Media
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Facebook URL</label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">YouTube URL</label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-border">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
