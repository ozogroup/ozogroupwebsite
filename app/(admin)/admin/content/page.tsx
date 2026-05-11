"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { Card, PageHeader, Badge, EmptyState, Button } from "@/components/admin/ui";
import { Plus, Pencil, Trash2, FileText, Search } from "lucide-react";

type SiteContent = {
  id: string;
  page: string;
  section: string;
  content_key: string;
  key_name: string;
  value: string;
  value_type: string;
  display_order: number;
  is_active: boolean;
};

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [pageFilter, setPageFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    page: "",
    section: "",
    content_key: "",
    key_name: "",
    value: "",
    value_type: "text",
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
        page: formData.page,
        section: formData.section,
        content_key: formData.content_key,
        key_name: formData.key_name,
        value: formData.value,
        value_type: formData.value_type,
        display_order: formData.display_order,
        is_active: formData.is_active,
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
      setToast({ type: "success", message: editingContent ? "Content updated successfully" : "Content created successfully" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save content");
      setToast({ type: "error", message: err.message || "Failed to save content" });
      setTimeout(() => setToast(null), 4000);
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
      page: contentItem.page || "",
      section: contentItem.section || "",
      content_key: contentItem.content_key || "",
      key_name: contentItem.key_name || "",
      value: contentItem.value || "",
      value_type: contentItem.value_type || "text",
      display_order: contentItem.display_order || 0,
      is_active: contentItem.is_active ?? true,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      page: "",
      section: "",
      content_key: "",
      key_name: "",
      value: "",
      value_type: "text",
      display_order: 0,
      is_active: true,
    });
  }

  function handleAdd() {
    resetForm();
    setEditingContent(null);
    setShowModal(true);
  }

  const pages = Array.from(new Set(content.map(c => c.page)));
  const sections = Array.from(new Set(content.map(c => c.section)));
  const filteredContent = content.filter(c => {
    const matchesPage = pageFilter === "all" || c.page === pageFilter;
    const matchesSection = sectionFilter === "all" || c.section === sectionFilter;
    const matchesSearch = searchQuery === "" || 
      c.key_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content_key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPage && matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg border ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.message}
        </div>
      )}

      <Breadcrumb items={[{ label: "Website Content" }]} />

      <PageHeader
        title="Website Content"
        description="Edit website copy, hero sections, image URLs, and links. Changes go live immediately."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
            Add Content
          </Button>
        }
      />

      {/* Filters Card */}
      <Card noPadding>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by key or name..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 focus:bg-white transition-colors placeholder:text-slate-400"
            />
          </div>
          <select
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
          >
            <option value="all">All pages</option>
            {pages.map(page => (
              <option key={page} value={page}>{page}</option>
            ))}
          </select>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 transition-colors"
          >
            <option value="all">All sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          <div className="ml-auto text-xs text-slate-500">
            {filteredContent.length} of {content.length} items
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/60">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Key</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Page</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Section</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">Loading content...</td>
              </tr>
            ) : filteredContent.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={FileText}
                    title="No content found"
                    description="Add your first content item or seed sample data."
                    action={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>Add content</Button>}
                  />
                </td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium text-slate-900">{item.key_name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{item.content_key}</div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 capitalize">{item.page}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant="info">{item.section}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={item.value_type === "image_url" ? "brand" : item.value_type === "link" ? "success" : "neutral"}>
                      {item.value_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-700 max-w-xs truncate">{item.value}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={item.is_active ? "success" : "neutral"} dot>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-slate-500 hover:text-brand-accent hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </Card>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Page *</label>
                  <input
                    type="text"
                    value={formData.page}
                    onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    placeholder="e.g., home, about, contact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Section *</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    placeholder="e.g., hero, about, contact"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Content Key *</label>
                  <input
                    type="text"
                    value={formData.content_key}
                    onChange={(e) => setFormData({ ...formData, content_key: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    placeholder="e.g., hero_title"
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
                    placeholder="e.g., Hero Title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Value Type</label>
                  <select
                    value={formData.value_type}
                    onChange={(e) => setFormData({ ...formData, value_type: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="image_url">Image URL</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    min={0}
                  />
                </div>
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

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-brand-border"
                  />
                  <span className="text-sm text-brand-ink">Active</span>
                </label>
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
