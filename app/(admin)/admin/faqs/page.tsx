"use client";

import { useState, useEffect } from "react";
import { getFaqs, createFaq, updateFaq, deleteFaq, toggleFaqActive } from "@/lib/actions/faqs";
import BackButton from "@/components/admin/BackButton";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  async function loadFaqs() {
    setLoading(true);
    const data = await getFaqs();
    setFaqs(data);
    setLoading(false);
  }

  function handleAdd() {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", category: "", display_order: 0 });
    setShowModal(true);
  }

  function handleEdit(faq: any) {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFaq) {
        await updateFaq(editingFaq.id, formData);
      } else {
        await createFaq(formData);
      }
      await loadFaqs();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving FAQ:", error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await deleteFaq(id);
      await loadFaqs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await toggleFaqActive(id, isActive);
      await loadFaqs();
    } catch (error) {
      console.error("Error toggling FAQ active:", error);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">FAQs</h1>
          <p className="text-sm text-brand-muted">Manage frequently asked questions</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-surface/50 border-b border-brand-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Question</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Category</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Order</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
              {faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-medium text-brand-ink">{faq.question}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{faq.category || "-"}</td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{faq.display_order}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(faq.id, !faq.is_active)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        faq.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {faq.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="px-3 py-1.5 text-xs font-medium text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">❓</span>
                      <p className="text-brand-muted">No FAQs yet</p>
                      <button
                        onClick={handleAdd}
                        className="text-sm text-brand-accent hover:underline"
                      >
                        Add your first FAQ
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-premium max-w-lg w-full p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <BackButton label="Close" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-ink mb-4 sm:mb-6">
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Question</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="e.g., How do I book a consultation?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Answer</label>
                <textarea
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all min-h-[100px] resize-none"
                  rows={4}
                  placeholder="Provide a clear and helpful answer..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Category (optional)</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="e.g., General, Membership, Treatments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  min={0}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save FAQ"}
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
