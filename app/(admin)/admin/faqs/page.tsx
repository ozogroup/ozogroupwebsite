"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Breadcrumb from "@/components/admin/Breadcrumb";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
};

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    setLoading(true);
    const { data, error } = await (supabase as any).from("faqs").select("*");
    if (error) {
      console.error("Error loading FAQs:", error);
      setFaqs([]);
    } else if (data && Array.isArray(data)) {
      setFaqs(data as unknown as FAQ[]);
    } else {
      setFaqs([]);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingFaq) {
        const { error } = await (supabase as any).from("faqs").update(data).eq("id", editingFaq.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("faqs").insert(data);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingFaq(null);
      resetForm();
      loadFaqs();
    } catch (err: any) {
      setError(err.message || "Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    
    const { error } = await (supabase as any).from("faqs").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      loadFaqs();
    }
  }

  function handleEdit(faq: any) {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || "",
      answer: faq.answer || "",
      category: faq.category || "",
      display_order: faq.display_order || 0,
      is_active: faq.is_active ?? true,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      question: "",
      answer: "",
      category: "",
      display_order: 0,
      is_active: true,
    });
  }

  function handleAdd() {
    resetForm();
    setEditingFaq(null);
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "FAQs" }]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">FAQs</h1>
          <p className="text-brand-muted">Manage frequently asked questions</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors"
        >
          Add FAQ
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Question</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-brand-ink uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : faqs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">❓</span>
                    <p className="text-brand-ink font-medium">No FAQs found</p>
                    <p className="text-sm text-brand-muted">Run SEED_DATA.sql or add your first FAQ</p>
                    <button
                      onClick={handleAdd}
                      className="mt-2 px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors"
                    >
                      Add FAQ
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-brand-ink">{faq.question}</td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{faq.category || "-"}</td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{faq.display_order}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      faq.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {faq.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-1 text-brand-muted hover:text-brand-accent rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
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
        <div className="fixed inset-0 bg-brand-ink/55 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">
                {editingFaq ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingFaq(null); }}
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
                <label className="block text-sm font-medium text-brand-ink mb-1">Question *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., How do I book a consultation?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Answer *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                  placeholder="Provide a clear and helpful answer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., General, Membership, Treatments"
                />
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
                  onClick={() => { setShowModal(false); setEditingFaq(null); }}
                  className="px-4 py-2 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingFaq ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
