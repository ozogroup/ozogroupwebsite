"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Breadcrumb from "@/components/admin/Breadcrumb";
import ImageUpload from "@/components/admin/ImageUpload";
import { treatmentKitSlugs } from "@/lib/treatments/catalog";
import { ensureFinalTreatmentCatalog } from "@/lib/actions/treatments";

type Treatment = {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  price_label?: string;
  kit_name?: string;
  unit?: string;
  description?: string;
  treatment_type?: string;
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
    kit_name: "",
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadTreatments();
  }, []);

  async function loadTreatments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("treatments" as any)
      .select("*")
      .is("deleted_at", null)
      .in("slug", treatmentKitSlugs as unknown as string[])
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading treatments:", error);
      setTreatments([]);
    } else if (data && Array.isArray(data)) {
      setTreatments(
        (data as unknown as Treatment[]).sort(
          (a, b) => treatmentKitSlugs.indexOf(a.slug as any) - treatmentKitSlugs.indexOf(b.slug as any)
        )
      );
    } else {
      setTreatments([]);
    }
    setLoading(false);
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 4500);
  }

  async function handleSyncFinalTreatments() {
    setSyncing(true);
    setError("");
    try {
      const result = await ensureFinalTreatmentCatalog();
      if (result?.error) {
        setError(result.error);
        showToast("error", result.error);
        return;
      }
      await loadTreatments();
      showToast("success", "Final treatment catalog synced.");
    } catch (err) {
      console.error("Error syncing treatments:", err);
      showToast("error", "Unable to sync treatments. Please check admin access and SQL columns.");
    } finally {
      setSyncing(false);
    }
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
        price_label:
          formData.price_label ||
          `₹${Number(parseFloat(formData.price) || 0).toLocaleString("en-IN")}`,
        kit_name: formData.kit_name || formData.title,
        treatment_type: formData.type === "home_kit" ? "home-kit" : "camp",
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
      showToast("success", "Treatment saved.");
    } catch (err: any) {
      console.error("Error saving treatment:", err);
      setError("Failed to save treatment. Please check required fields and SQL columns.");
      showToast("error", "Failed to save treatment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Disable this treatment? It will stay editable in admin but stop showing on the website.")) return;
    
    const { error } = await supabase
      .from("treatments" as any)
      .update({ active: false, is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("Error disabling treatment:", error);
      showToast("error", "Unable to disable treatment.");
    } else {
      loadTreatments();
      showToast("success", "Treatment disabled.");
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
      kit_name: treatment.kit_name || treatment.title || "",
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
      kit_name: "",
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
      {toast && (
        <div className={`fixed top-20 right-6 z-[100] max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm ${
          toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.message}
        </div>
      )}
      <Breadcrumb items={[{ label: "Treatments" }]} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Treatments</h1>
          <p className="text-brand-muted">Manage the live kit and campaign catalog shown on the website.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSyncFinalTreatments}
            disabled={syncing}
            className="px-4 py-2 border border-brand-border rounded-lg text-brand-ink hover:border-brand-accent hover:text-brand-accent transition-colors disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Sync Final 5"}
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
          >
            Add Treatment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Treatment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Kit / Campaign</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Active</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-ink uppercase">Featured</th>
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
                    <p className="text-sm text-brand-muted">Supabase has no final kit/campaign records yet.</p>
                    <button
                      onClick={handleSyncFinalTreatments}
                      disabled={syncing}
                      className="mt-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
                    >
                      {syncing ? "Syncing..." : "Seed Final 5 Treatments"}
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
                    <p className="text-xs text-brand-muted mt-1 line-clamp-2">{treatment.description || treatment.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded bg-brand-light/55 text-brand-primaryDark">
                      {treatment.type === "home_kit" ? "Kit" : treatment.type === "campaign" ? "Campaign" : treatment.type}
                    </span>
                    <p className="text-xs text-brand-muted mt-1">{treatment.kit_name || treatment.title}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    {treatment.price_label || `₹${treatment.price.toLocaleString()}`}
                    {treatment.unit && <p className="text-xs font-normal text-brand-muted mt-1">{treatment.unit}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      treatment.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {treatment.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      treatment.featured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {treatment.featured ? "Featured" : "Normal"}
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
                        title="Disable"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-ink/55 flex items-center justify-center p-4 z-50">
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
                  <label className="block text-sm font-medium text-brand-ink mb-1">Kit Name</label>
                  <input
                    type="text"
                    value={formData.kit_name}
                    onChange={(e) => setFormData({ ...formData, kit_name: e.target.value })}
                    placeholder="e.g., Korean Glass Kit"
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Featured Treatment</label>
                  <label className="flex h-[42px] items-center gap-2 px-3 py-2 border border-brand-border rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-brand-border"
                    />
                    <span className="text-sm text-brand-ink">Mark as featured</span>
                  </label>
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
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    folder="treatments"
                    label="Image"
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
