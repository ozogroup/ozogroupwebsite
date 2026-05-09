"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SiteContent = {
  id: string;
  section: string;
  key_name: string;
  value: string;
};

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [formData, setFormData] = useState({
    section: "",
    key_name: "",
    value: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    const { data, error } = await (supabase as any).from("site_content").select("*");
    if (error) {
      console.error("Error loading content:", error);
      setContent([]);
    } else if (data && Array.isArray(data)) {
      setContent(data as unknown as SiteContent[]);
    } else {
      setContent([]);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = {
        section: formData.section,
        key_name: formData.key_name,
        value: formData.value,
      };

      if (editingContent) {
        const { error } = await (supabase as any).from("site_content").update(data).eq("id", editingContent.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("site_content").insert(data);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingContent(null);
      resetForm();
      loadContent();
    } catch (err: any) {
      setError(err.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this content item?")) return;
    
    const { error } = await (supabase as any).from("site_content").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      loadContent();
    }
  }

  function handleEdit(contentItem: any) {
    setEditingContent(contentItem);
    setFormData({
      section: contentItem.section || "",
      key_name: contentItem.key_name || "",
      value: contentItem.value || "",
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      section: "",
      key_name: "",
      value: "",
    });
  }

  function handleAdd() {
    resetForm();
    setEditingContent(null);
    setShowModal(true);
  }

  const sections = Array.from(new Set(content.map(c => c.section)));
  const filteredContent = sectionFilter === "all" 
    ? content 
    : content.filter(c => c.section === sectionFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Website Content</h1>
          <p className="text-brand-muted">Manage website content and text</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          Add Content
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-brand-ink">Filter by Section:</label>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
        >
          <option value="all">All Sections</option>
          {sections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Section</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Key</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Value</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-brand-ink uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : filteredContent.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">📝</span>
                    <p className="text-brand-ink font-medium">No content found</p>
                    <p className="text-sm text-brand-muted">Run SEED_DATA.sql or add your first content item</p>
                    <button
                      onClick={handleAdd}
                      className="mt-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
                    >
                      Add Content
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">
                      {item.section}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{item.key_name}</td>
                  <td className="px-4 py-3 text-sm text-brand-ink max-w-md truncate">{item.value}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-brand-muted hover:text-brand-accent rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-brand-muted hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">
                {editingContent ? "Edit Content" : "Add Content"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingContent(null); }}
                className="p-1 text-brand-muted hover:text-brand-ink"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Section *</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., home_hero, about, contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Key Name *</label>
                <input
                  type="text"
                  value={formData.key_name}
                  onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., hero_title, about_description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Value *</label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                  placeholder="Content value..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingContent(null); }}
                  className="px-4 py-2 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingContent ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
