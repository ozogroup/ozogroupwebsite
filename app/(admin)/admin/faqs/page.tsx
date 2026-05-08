"use client";

import { useState, useEffect } from "react";
import { getFaqs, createFaq, updateFaq, deleteFaq, toggleFaqActive } from "@/lib/actions/faqs";

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
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FAQs Management</h1>
          <p className="text-slate-600">Manage frequently asked questions</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
        >
          Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-4 text-sm font-semibold text-slate-900">Question</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-900">Category</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-900">Order</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{faq.question}</div>
                  </td>
                  <td className="p-4 text-slate-600">{faq.category || "-"}</td>
                  <td className="p-4 text-slate-600">{faq.display_order}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(faq.id, !faq.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        faq.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {faq.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="px-3 py-1 text-sm text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No FAQs found. Add your first FAQ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Answer</label>
                <textarea
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent min-h-[100px]"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category (optional)</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="e.g., General, Membership, Treatments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                  min={0}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
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
