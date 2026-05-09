"use client";

import { useState, useEffect } from "react";
import { getTreatments, deleteTreatment, toggleTreatmentActive, createTreatment, updateTreatment } from "@/lib/actions/treatments";
import ImageUpload from "@/components/admin/ImageUpload";
import BackButton from "@/components/admin/BackButton";

type Treatment = {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  tagline: string;
  description: string;
  benefits: any;
  process?: any;
  safety?: any;
  duration: string;
  sessions: string;
  image: string;
  available_cities: any;
  category?: string;
  cta_text?: string;
  active: boolean;
  featured?: boolean;
  requires_slots: boolean;
  created_at: string;
};

export default function AdminTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
    loadTreatments();
  }, []);

  async function loadTreatments() {
    setLoading(true);
    const data = await getTreatments();
    setTreatments(data as unknown as Treatment[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this treatment?")) return;
    const result = await deleteTreatment(id);
    if (result.error) {
      alert(result.error);
    } else {
      loadTreatments();
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    const result = await toggleTreatmentActive(id, !currentActive);
    if (result.error) {
      alert(result.error);
    } else {
      loadTreatments();
    }
  }

  const filteredTreatments = treatments.filter((treatment) => {
    const matchesSearch =
      treatment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      treatment.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || treatment.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">Treatments</h1>
          <p className="text-sm text-brand-muted">Manage skincare treatments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Treatment
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search treatments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        >
          <option value="all">All Types</option>
          <option value="home_kit">Home Kit</option>
          <option value="clinic">Clinic</option>
          <option value="campaign">Campaign</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-brand-surface/50 border-b border-brand-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Treatment Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-brand-ink uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-brand-muted">
                  <div className="animate-spin w-6 h-6 border-3 border-brand-accent border-t-transparent rounded-full mx-auto" />
                </td>
              </tr>
            ) : filteredTreatments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">💆</span>
                    <p className="text-brand-muted">No treatments found</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="text-sm text-brand-accent hover:underline"
                    >
                      Add your first treatment
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTreatments.map((treatment) => (
                <tr key={treatment.id} className="hover:bg-brand-surface/30 transition-colors">
                  <td className="px-6 py-4">
                    {treatment.image ? (
                      <img
                        src={treatment.image}
                        alt={treatment.title}
                        className="w-12 h-12 rounded-lg object-cover border border-brand-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-brand-surface flex items-center justify-center text-brand-muted text-xs border border-brand-border">
                        No image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-brand-ink">{treatment.title}</p>
                      <p className="text-xs text-brand-muted">{treatment.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      treatment.type === 'home_kit' ? 'bg-blue-50 text-blue-700' :
                      treatment.type === 'clinic' ? 'bg-purple-50 text-purple-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {treatment.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-brand-ink">₹{treatment.price}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(treatment.id, treatment.active)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        treatment.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {treatment.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTreatment(treatment);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(treatment.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
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

      {/* Add Modal */}
      {showAddModal && (
        <TreatmentFormModal
          onClose={() => {
            setShowAddModal(false);
            loadTreatments();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTreatment && (
        <TreatmentFormModal
          treatment={selectedTreatment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTreatment(null);
            loadTreatments();
          }}
        />
      )}
    </div>
  );
}

function TreatmentFormModal({
  treatment,
  onClose,
}: {
  treatment?: Treatment | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(treatment?.image || "");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    // Override image field with state value (from upload)
    formData.set("image", imageUrl);

    const { createTreatment, updateTreatment } = await import("@/lib/actions/treatments");

    const result = treatment
      ? await updateTreatment(formData)
      : await createTreatment(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-premium w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-brand-border sticky top-0 bg-white z-10">
          <BackButton label="Close" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-ink">
            {treatment ? "Edit Treatment" : "Add Treatment"}
          </h2>
        </div>

        <form action={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {treatment && (
            <input type="hidden" name="id" value={treatment.id} />
          )}

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Treatment Title *
            </label>
            <input
              type="text"
              name="title"
              defaultValue={treatment?.title || ""}
              required
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="e.g., Anti-Aging Facial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">Slug *</label>
            <input
              type="text"
              name="slug"
              defaultValue={treatment?.slug || ""}
              required
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="e.g., anti-aging-facial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">Category</label>
            <input
              type="text"
              name="category"
              defaultValue={treatment?.category || ""}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="e.g., Facials, Body Treatments"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">Type *</label>
            <select
              name="type"
              defaultValue={treatment?.type || "home_kit"}
              required
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
            >
              <option value="home_kit">Home Kit</option>
              <option value="clinic">Clinic</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">Price (₹) *</label>
            <input
              type="number"
              name="price"
              defaultValue={treatment?.price || ""}
              required
              step="0.01"
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Tagline
            </label>
            <input
              type="text"
              name="tagline"
              defaultValue={treatment?.tagline || ""}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="Short tagline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={treatment?.description || ""}
              rows={4}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
              placeholder="Treatment description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Benefits (JSON array)
            </label>
            <textarea
              name="benefits"
              defaultValue={treatment?.benefits ? JSON.stringify(treatment.benefits) : "[]"}
              rows={3}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
              placeholder='["Benefit 1", "Benefit 2"]'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Process (JSON array)
            </label>
            <textarea
              name="process"
              defaultValue={treatment?.process ? JSON.stringify(treatment.process) : "[]"}
              rows={3}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
              placeholder='["Step 1", "Step 2"]'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Safety (JSON array)
            </label>
            <textarea
              name="safety"
              defaultValue={treatment?.safety ? JSON.stringify(treatment.safety) : "[]"}
              rows={3}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
              placeholder='["Safety note 1", "Safety note 2"]'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">Duration</label>
            <input
              type="text"
              name="duration"
              defaultValue={treatment?.duration || ""}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="e.g., 60 minutes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">Sessions</label>
            <input
              type="text"
              name="sessions"
              defaultValue={treatment?.sessions || ""}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="e.g., 1 session"
            />
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            folder="treatments"
            label="Treatment Image"
          />
          <input type="hidden" name="image" value={imageUrl} />

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              CTA Text
            </label>
            <input
              type="text"
              name="cta_text"
              defaultValue={treatment?.cta_text || "Book Now"}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
              placeholder="e.g., Book Now"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-2">
              Available Cities (JSON array)
            </label>
            <textarea
              name="available_cities"
              defaultValue={treatment?.available_cities ? JSON.stringify(treatment.available_cities) : "[]"}
              rows={2}
              className="w-full px-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
              placeholder='["Mumbai", "Delhi"]'
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={treatment?.active ?? true}
                className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
              />
              <span className="text-sm text-brand-ink">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={treatment?.featured ?? false}
                className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
              />
              <span className="text-sm text-brand-ink">Featured</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requires_slots"
                defaultChecked={treatment?.requires_slots ?? false}
                className="w-4 h-4 text-brand-accent rounded border-brand-border focus:ring-brand-accent"
              />
              <span className="text-sm text-brand-ink">Requires Slots</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-brand-border text-brand-ink text-sm font-medium rounded-lg hover:bg-brand-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
            >
              {loading ? "Saving..." : treatment ? "Update Treatment" : "Create Treatment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
