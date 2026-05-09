"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Treatment = {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  price_label?: string;
  image: string;
  active: boolean;
  featured?: boolean;
};

export default function AdminTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "clinic",
    price: "",
    price_label: "",
    unit: "per session",
    subtitle: "",
    description: "",
    overview: "",
    image: "",
    image_alt: "",
    duration: "",
    sessions: "",
    badge: "",
    benefits: "",
    safety: "",
    available_cities: "",
    cta_text: "Book Now",
    active: true,
    featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadTreatments();
  }, []);

  async function loadTreatments() {
    setLoading(true);
    const { data, error } = await supabase.from("treatments" as any).select("*");
    if (error) {
      console.error("Error loading treatments:", error);
      setTreatments([]);
    } else if (data && Array.isArray(data)) {
      setTreatments(data as unknown as Treatment[]);
    } else {
      setTreatments([]);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Convert comma-separated fields to JSON arrays
      const benefitsArray = formData.benefits ? formData.benefits.split(",").map(b => b.trim()).filter(b => b) : [];
      const availableCitiesArray = formData.available_cities ? formData.available_cities.split(",").map(c => c.trim()).filter(c => c) : [];

      const data = {
        title: formData.title,
        slug: formData.slug,
        type: formData.type,
        price: parseFloat(formData.price),
        price_label: formData.price_label,
        unit: formData.unit,
        subtitle: formData.subtitle,
        description: formData.description,
        overview: formData.overview,
        image: formData.image,
        image_alt: formData.image_alt,
        duration: formData.duration,
        sessions: formData.sessions,
        badge: formData.badge,
        benefits: benefitsArray,
        safety: formData.safety,
        available_cities: availableCitiesArray,
        cta_text: formData.cta_text,
        active: formData.active,
        featured: formData.featured,
      };

      if (editingTreatment) {
        const { error } = await supabase.from("treatments" as any).update(data).eq("id", editingTreatment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("treatments" as any).insert(data);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingTreatment(null);
      resetForm();
      loadTreatments();
    } catch (err: any) {
      setError(err.message || "Failed to save treatment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this treatment?")) return;
    
    const { error } = await supabase.from("treatments" as any).delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      loadTreatments();
    }
  }

  function handleEdit(treatment: any) {
    setEditingTreatment(treatment);
    setFormData({
      title: treatment.title || "",
      slug: treatment.slug || "",
      type: treatment.type || "clinic",
      price: treatment.price?.toString() || "",
      price_label: treatment.price_label || "",
      unit: treatment.unit || "per session",
      subtitle: treatment.subtitle || "",
      description: treatment.description || "",
      overview: treatment.overview || "",
      image: treatment.image || "",
      image_alt: treatment.image_alt || "",
      duration: treatment.duration || "",
      sessions: treatment.sessions || "",
      badge: treatment.badge || "",
      benefits: Array.isArray(treatment.benefits) ? treatment.benefits.join(", ") : "",
      safety: treatment.safety || "",
      available_cities: Array.isArray(treatment.available_cities) ? treatment.available_cities.join(", ") : "",
      cta_text: treatment.cta_text || "Book Now",
      active: treatment.active ?? true,
      featured: treatment.featured ?? false,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      title: "",
      slug: "",
      type: "clinic",
      price: "",
      price_label: "",
      unit: "per session",
      subtitle: "",
      description: "",
      overview: "",
      image: "",
      image_alt: "",
      duration: "",
      sessions: "",
      badge: "",
      benefits: "",
      safety: "",
      available_cities: "",
      cta_text: "Book Now",
      active: true,
      featured: false,
    });
  }

  function handleAdd() {
    resetForm();
    setEditingTreatment(null);
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Treatments</h1>
          <p className="text-brand-muted">Manage skincare treatments and services</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          Add Treatment
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Price</th>
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
            ) : treatments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">💆</span>
                    <p className="text-brand-ink font-medium">No treatments found</p>
                    <p className="text-sm text-brand-muted">Run SEED_DATA.sql or add your first treatment</p>
                    <button
                      onClick={handleAdd}
                      className="mt-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
                    >
                      Add Treatment
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              treatments.map((treatment) => (
                <tr key={treatment.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {treatment.image ? (
                      <img
                        src={treatment.image}
                        alt={treatment.title}
                        className="w-12 h-12 rounded-lg object-cover border border-brand-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-ink">{treatment.title}</p>
                    {treatment.featured && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">Featured</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{treatment.slug}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">
                      {treatment.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    {treatment.price_label || `₹${treatment.price.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      treatment.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {treatment.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(treatment)}
                        className="p-1 text-brand-muted hover:text-brand-accent rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(treatment.id)}
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">
                {editingTreatment ? "Edit Treatment" : "Add Treatment"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingTreatment(null); }}
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
                  <label className="block text-sm font-medium text-brand-ink mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  >
                    <option value="clinic">Clinic</option>
                    <option value="home_kit">Home Kit</option>
                    <option value="campaign">Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Price *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    step="0.01"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Price Label</label>
                  <input
                    type="text"
                    value={formData.price_label}
                    onChange={(e) => setFormData({ ...formData, price_label: e.target.value })}
                    placeholder="e.g., ₹18,000"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="per session"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Overview</label>
                <textarea
                  value={formData.overview}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Image Alt</label>
                  <input
                    type="text"
                    value={formData.image_alt}
                    onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60 min"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Sessions</label>
                  <input
                    type="text"
                    value={formData.sessions}
                    onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
                    placeholder="e.g., 1 session"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Badge</label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g., Premium"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Benefits (comma-separated)</label>
                <textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  rows={3}
                  placeholder="Benefit 1, Benefit 2, Benefit 3"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Safety</label>
                <textarea
                  value={formData.safety}
                  onChange={(e) => setFormData({ ...formData, safety: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">Available Cities (comma-separated)</label>
                <input
                  type="text"
                  value={formData.available_cities}
                  onChange={(e) => setFormData({ ...formData, available_cities: e.target.value })}
                  placeholder="Mumbai, Delhi, Bangalore"
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1">CTA Text</label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-brand-border"
                  />
                  <span className="text-sm text-brand-ink">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-brand-border"
                  />
                  <span className="text-sm text-brand-ink">Featured</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTreatment(null); }}
                  className="px-4 py-2 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTreatment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
