"use client";

import { useState, useEffect } from "react";
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, toggleTestimonialActive } from "@/lib/actions/testimonials";
import ImageUpload from "@/components/admin/ImageUpload";
import BackButton from "@/components/admin/BackButton";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    message: "",
    rating: 5,
    image: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    setLoading(true);
    const data = await getTestimonials();
    setTestimonials(data);
    setLoading(false);
  }

  function handleAdd() {
    setEditingTestimonial(null);
    setFormData({ name: "", role: "", message: "", rating: 5, image: "" });
    setShowModal(true);
  }

  function handleEdit(testimonial: any) {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      message: testimonial.message,
      rating: testimonial.rating,
      image: testimonial.image,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial.id, formData);
      } else {
        await createTestimonial(formData);
      }
      await loadTestimonials();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving testimonial:", error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await deleteTestimonial(id);
      await loadTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await toggleTestimonialActive(id, isActive);
      await loadTestimonials();
    } catch (error) {
      console.error("Error toggling testimonial active:", error);
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
          <h1 className="font-display text-2xl font-bold text-brand-ink">Testimonials</h1>
          <p className="text-sm text-brand-muted">Manage customer testimonials</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Testimonial
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-surface/50 border-b border-brand-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Customer</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Role</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Rating</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Message</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-border">
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-medium text-brand-ink">{testimonial.name}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm">{testimonial.role}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < testimonial.rating ? "text-yellow-400" : "text-slate-200"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-brand-muted text-sm max-w-xs truncate">{testimonial.message}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(testimonial)}
                        className="px-3 py-1.5 text-xs font-medium text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">⭐</span>
                      <p className="text-brand-muted">No testimonials yet</p>
                      <button
                        onClick={handleAdd}
                        className="text-sm text-brand-accent hover:underline"
                      >
                        Add your first testimonial
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
          <div className="bg-white rounded-xl shadow-soft max-w-lg w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-brand-ink">
                {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-brand-muted hover:text-brand-ink transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="e.g., Priya Sharma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Role / Location</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="e.g., Customer from Ahmedabad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Testimonial Message</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all min-h-[100px] resize-none"
                  rows={4}
                  placeholder="Share their experience..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="testimonials"
                label="Customer Photo (optional)"
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Testimonial"}
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
