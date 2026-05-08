"use client";

import { useState, useEffect } from "react";
import { getTreatments, deleteTreatment, toggleTreatmentActive } from "@/lib/actions/treatments";

type Treatment = {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  tagline: string;
  description: string;
  benefits: any;
  duration: string;
  sessions: string;
  image: string;
  available_cities: any;
  active: boolean;
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
    setTreatments(data as Treatment[]);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Treatments</h1>
          <p className="text-slate-600">Manage skincare treatments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
        >
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
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
        >
          <option value="all">All Types</option>
          <option value="home_kit">Home Kit</option>
          <option value="clinic">Clinic</option>
          <option value="campaign">Campaign</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Treatment Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredTreatments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No treatments found</td>
              </tr>
            ) : (
              filteredTreatments.map((treatment) => (
                <tr key={treatment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {treatment.image ? (
                      <img
                        src={treatment.image}
                        alt={treatment.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                        No image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{treatment.title}</p>
                      <p className="text-sm text-slate-500">{treatment.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {treatment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">₹{treatment.price}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(treatment.id, treatment.active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        treatment.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
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
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(treatment.id)}
                        className="text-sm text-red-600 hover:text-red-700"
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

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {treatment ? "Edit Treatment" : "Add Treatment"}
          </h2>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {treatment && (
            <input type="hidden" name="id" value={treatment.id} />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              defaultValue={treatment?.title || ""}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="Treatment name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Slug *</label>
            <input
              type="text"
              name="slug"
              defaultValue={treatment?.slug || ""}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="treatment-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
            <select
              name="type"
              defaultValue={treatment?.type || "home_kit"}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
            >
              <option value="home_kit">Home Kit</option>
              <option value="clinic">Clinic</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Price (₹) *</label>
            <input
              type="number"
              name="price"
              defaultValue={treatment?.price || ""}
              required
              step="0.01"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              name="tagline"
              defaultValue={treatment?.tagline || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="Short tagline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={treatment?.description || ""}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="Treatment description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Benefits (JSON array)
            </label>
            <textarea
              name="benefits"
              defaultValue={treatment?.benefits ? JSON.stringify(treatment.benefits) : "[]"}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder='["Benefit 1", "Benefit 2"]'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
            <input
              type="text"
              name="duration"
              defaultValue={treatment?.duration || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="e.g., 60 minutes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sessions</label>
            <input
              type="text"
              name="sessions"
              defaultValue={treatment?.sessions || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="e.g., 1 session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image URL
            </label>
            <input
              type="text"
              name="image"
              defaultValue={treatment?.image || ""}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Cities (JSON array)
            </label>
            <textarea
              name="available_cities"
              defaultValue={treatment?.available_cities ? JSON.stringify(treatment.available_cities) : "[]"}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
              placeholder='["Mumbai", "Delhi"]'
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={treatment?.active ?? true}
                className="w-4 h-4 text-brand-accent rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requires_slots"
                defaultChecked={treatment?.requires_slots ?? false}
                className="w-4 h-4 text-brand-accent rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Requires Slots</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : treatment ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
