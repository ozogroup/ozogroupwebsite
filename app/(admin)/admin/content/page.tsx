"use client";

import { useState, useEffect } from "react";
import { getSiteContent, updateSiteContent, updateSiteContentBulk } from "@/lib/actions/content";

export default function AdminContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    const data = await getSiteContent();
    setContent(data);
    setLoading(false);
  }

  function handleEdit(section: string) {
    setEditingSection(section);
    const sectionContent = content.filter((c) => c.section === section);
    const formData: Record<string, string> = {};
    sectionContent.forEach((c) => {
      formData[c.key_name] = c.value;
    });
    setFormData(formData);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = Object.entries(formData).map(([key, value]) => {
        const item = content.find((c) => c.key_name === key);
        return { id: item?.id, value };
      });
      await handleBulkUpdate(updates);
      await loadContent();
      setEditingSection(null);
    } catch (error) {
      console.error("Error saving content:", error);
    }
    setSaving(false);
  }

  async function handleBulkUpdate(updates: { id: string; value: string }[]) {
    try {
      await updateSiteContentBulk(updates);
    } catch (error) {
      console.error("Error saving content:", error);
      throw error;
    }
  }

  const sections = [
    { id: "home_hero", name: "Home Hero", icon: "🏠", description: "Edit homepage hero title, subtitle, and CTAs" },
    { id: "home_treatment", name: "Treatment Section", icon: "💆", description: "Edit treatment section heading and description" },
    { id: "home_membership", name: "Membership Section", icon: "👥", description: "Edit membership pricing and benefits" },
    { id: "home_referral", name: "Referral Section", icon: "🔗", description: "Edit referral program details" },
    { id: "about", name: "About Page", icon: "ℹ️", description: "Edit company information and story" },
    { id: "contact", name: "Contact Information", icon: "📞", description: "Edit phone, email, and address" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (editingSection) {
    const sectionContent = content.filter((c) => c.section === editingSection);
    const sectionInfo = sections.find((s) => s.id === editingSection);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditingSection(null)}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{sectionInfo?.name}</h1>
            <p className="text-slate-600">{sectionInfo?.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-6">
          {sectionContent.map((item) => (
            <div key={item.id}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {item.key_name.charAt(0).toUpperCase() + item.key_name.slice(1).replace(/_/g, " ")}
              </label>
              {item.value_type === "image_url" ? (
                <input
                  type="url"
                  value={formData[item.key_name] || ""}
                  onChange={(e) => setFormData({ ...formData, [item.key_name]: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="https://example.com/image.jpg"
                />
              ) : item.value === "html" ? (
                <textarea
                  value={formData[item.key_name] || ""}
                  onChange={(e) => setFormData({ ...formData, [item.key_name]: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent min-h-[150px]"
                  rows={6}
                />
              ) : (
                <input
                  type="text"
                  value={formData[item.key_name] || ""}
                  onChange={(e) => setFormData({ ...formData, [item.key_name]: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              )}
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setEditingSection(null)}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Website Content Management</h1>
        <p className="text-slate-600">Edit website content across all pages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:border-brand-accent transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{section.icon}</span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{section.name}</h2>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
            </div>
            <button
              onClick={() => handleEdit(section.id)}
              className="w-full px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
            >
              Edit Content
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
