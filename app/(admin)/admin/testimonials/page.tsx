"use client";

import { useCallback, useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonials,
  updateTestimonial,
} from "@/lib/actions/testimonials";

type Testimonial = {
  id: string;
  name: string;
  city: string;
  treatment: string;
  quote: string;
  rating: number;
  is_active: boolean;
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    treatment: "",
    quote: "",
    rating: 5,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTestimonials();
      setTestimonials(Array.isArray(data) ? (data as unknown as Testimonial[]) : []);
    } catch (err: any) {
      console.error("Error loading testimonials:", err);
      setTestimonials([]);
      setError(err?.message || "Unable to load testimonials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = {
        name: formData.name,
        city: formData.city,
        treatment: formData.treatment,
        quote: formData.quote,
        rating: formData.rating,
        is_active: formData.is_active,
      };

      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial.id, data);
      } else {
        await createTestimonial(data);
      }

      setShowModal(false);
      setEditingTestimonial(null);
      resetForm();
      await loadTestimonials();
    } catch (err: any) {
      setError(err.message || "Failed to save testimonial");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      await deleteTestimonial(id);
      await loadTestimonials();
    } catch (err: any) {
      alert(err?.message || "Failed to delete testimonial");
    }
  }

  function handleEdit(testimonial: any) {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name || "",
      city: testimonial.city || "",
      treatment: testimonial.treatment || "",
      quote: testimonial.quote || "",
      rating: testimonial.rating || 5,
      is_active: testimonial.is_active ?? true,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: "",
      city: "",
      treatment: "",
      quote: "",
      rating: 5,
      is_active: true,
    });
  }

  function handleAdd() {
    resetForm();
    setEditingTestimonial(null);
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Testimonials" }]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Testimonials</h1>
          <p className="text-brand-muted">Manage customer testimonials</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors"
        >
          Add Testimonial
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">City</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Treatment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Quote</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-brand-ink uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-brand-muted">
                  Loading...
                </td>
              </tr>
            ) : testimonials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">⭐</span>
                    <p className="text-brand-ink font-medium">No testimonials found</p>
                    <p className="text-sm text-brand-muted">Run SEED_DATA.sql or add your first testimonial</p>
                    <button
                      onClick={handleAdd}
                      className="mt-2 px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors"
                    >
                      Add Testimonial
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              testimonials.map((testimonial) => (
                <tr key={testimonial.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-brand-ink">{testimonial.name}</td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{testimonial.city}</td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{testimonial.treatment}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < testimonial.rating ? "text-yellow-400" : "text-slate-200"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-muted max-w-xs truncate">{testimonial.quote}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      testimonial.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {testimonial.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(testimonial)}
                        className="p-1 text-brand-muted hover:text-brand-accent rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial.id)}
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
                {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingTestimonial(null); }}
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
                <label className="block text-sm font-medium text-brand-ink mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., Priya Sharma"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., Ahmedabad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Treatment</label>
                <input
                  type="text"
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  placeholder="e.g., Korean Glass Treatment Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Quote *</label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                  placeholder="Share their experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
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
                  onClick={() => { setShowModal(false); setEditingTestimonial(null); }}
                  className="px-4 py-2 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTestimonial ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
