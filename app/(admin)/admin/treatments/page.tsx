"use client";

import { useState, useEffect } from "react";
import { getTreatments, deleteTreatment, toggleTreatmentActive, createTreatment, updateTreatment } from "@/lib/actions/treatments";
import ImageUpload from "@/components/admin/ImageUpload";

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
  before_image?: string;
  after_image?: string;
  gallery?: string[];
  available_cities: any;
  category?: string;
  cta_text?: string;
  active: boolean;
  featured?: boolean;
  requires_slots: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  display_order?: number;
  created_at: string;
};

export default function AdminTreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
    if (!confirm("Are you sure you want to delete this treatment? This action cannot be undone.")) return;
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

  async function handleDuplicate(treatment: Treatment) {
    if (!confirm(`Duplicate "${treatment.title}"? This will create a copy with the same settings.`)) return;
    
    const formData = new FormData();
    formData.set("title", `${treatment.title} (Copy)`);
    formData.set("slug", `${treatment.slug}-copy-${Date.now()}`);
    formData.set("type", treatment.type);
    formData.set("price", treatment.price.toString());
    formData.set("tagline", treatment.tagline || "");
    formData.set("description", treatment.description);
    formData.set("benefits", JSON.stringify(treatment.benefits || []));
    formData.set("process", JSON.stringify(treatment.process || []));
    formData.set("safety", JSON.stringify(treatment.safety || []));
    formData.set("duration", treatment.duration);
    formData.set("sessions", treatment.sessions);
    formData.set("image", treatment.image);
    formData.set("before_image", treatment.before_image || "");
    formData.set("after_image", treatment.after_image || "");
    formData.set("gallery", JSON.stringify(treatment.gallery || []));
    formData.set("available_cities", JSON.stringify(treatment.available_cities || []));
    formData.set("category", treatment.category || "");
    formData.set("cta_text", treatment.cta_text || "Book Now");
    formData.set("active", "false");
    formData.set("featured", treatment.featured ? "true" : "false");
    formData.set("requires_slots", treatment.requires_slots ? "true" : "false");
    formData.set("seo_title", treatment.seo_title || "");
    formData.set("seo_description", treatment.seo_description || "");
    formData.set("seo_keywords", treatment.seo_keywords || "");
    formData.set("display_order", (treatment.display_order || 0).toString());

    const result = await createTreatment(formData);
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
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && treatment.active) ||
      (statusFilter === "inactive" && !treatment.active);
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedTreatments = [...filteredTreatments].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Treatments</h1>
          <p className="text-slate-600 mt-1">Manage skincare treatments and services</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Treatments</p>
          <p className="text-2xl font-bold text-slate-900">{treatments.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{treatments.filter(t => t.active).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Home Kits</p>
          <p className="text-2xl font-bold text-slate-900">{treatments.filter(t => t.type === 'home_kit').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Clinic Services</p>
          <p className="text-2xl font-bold text-slate-900">{treatments.filter(t => t.type === 'clinic').length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search treatments by name or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        >
          <option value="all">All Types</option>
          <option value="home_kit">Home Kit</option>
          <option value="clinic">Clinic</option>
          <option value="campaign">Campaign</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Treatment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="animate-spin w-6 h-6 border-3 border-brand-accent border-t-transparent rounded-full mx-auto" />
                </td>
              </tr>
            ) : sortedTreatments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">💆</span>
                    <p className="text-slate-600 font-medium">No treatments found</p>
                    <p className="text-sm text-slate-500">Create your first treatment to get started</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
                    >
                      Add Treatment
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedTreatments.map((treatment) => (
                <tr key={treatment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {treatment.image ? (
                      <img
                        src={treatment.image}
                        alt={treatment.title}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs border border-slate-200">
                        No image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{treatment.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{treatment.slug}</p>
                      {treatment.featured && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Featured</span>
                      )}
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
                  <td className="px-6 py-4 font-semibold text-slate-900">₹{treatment.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(treatment.id, treatment.active)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                        treatment.active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {treatment.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{treatment.display_order || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedTreatment(treatment);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-slate-600 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDuplicate(treatment)}
                        className="p-2 text-slate-600 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(treatment.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageUrl, setImageUrl] = useState(treatment?.image || "");
  const [beforeImageUrl, setBeforeImageUrl] = useState(treatment?.before_image || "");
  const [afterImageUrl, setAfterImageUrl] = useState(treatment?.after_image || "");
  const [galleryUrls, setGalleryUrls] = useState<string[]>(treatment?.gallery || []);
  const [galleryInput, setGalleryInput] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  async function handleSubmit(formData: FormData) {
    const validationErrors = validateFormData(formData);
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    // Override image fields with state values (from upload)
    formData.set("image", imageUrl);
    formData.set("before_image", beforeImageUrl);
    formData.set("after_image", afterImageUrl);
    formData.set("gallery", JSON.stringify(galleryUrls));

    const { createTreatment, updateTreatment } = await import("@/lib/actions/treatments");

    const result = treatment
      ? await updateTreatment(formData)
      : await createTreatment(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }

  function validateFormData(formData: FormData): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!formData.get("title")?.toString().trim()) {
      errors.title = "Treatment title is required";
    }
    if (!formData.get("slug")?.toString().trim()) {
      errors.slug = "Slug is required";
    }
    if (!formData.get("type")?.toString().trim()) {
      errors.type = "Type is required";
    }
    if (!formData.get("price")?.toString().trim()) {
      errors.price = "Price is required";
    }
    
    // Validate JSON fields
    const jsonFields = ["benefits", "process", "safety", "available_cities"];
    jsonFields.forEach((field) => {
      const value = formData.get(field)?.toString();
      if (value) {
        try {
          JSON.parse(value);
        } catch {
          errors[field] = `Invalid JSON format`;
        }
      }
    });

    return errors;
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        onClose();
      }
    } else {
      onClose();
    }
  }

  function handleFieldChange() {
    setHasUnsavedChanges(true);
    setSuccess(false);
  }

  function addGalleryImage() {
    if (galleryInput && !galleryUrls.includes(galleryInput)) {
      setGalleryUrls([...galleryUrls, galleryInput]);
      setGalleryInput("");
    }
  }

  function removeGalleryImage(index: number) {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-premium w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-white z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">
                {treatment ? "Edit Treatment" : "Add Treatment"}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {treatment ? "Update treatment details" : "Create a new treatment"}
              </p>
            </div>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50 px-6">
          <nav className="flex gap-6">
            {[
              { id: "basic", label: "Basic Info" },
              { id: "images", label: "Images" },
              { id: "details", label: "Details" },
              { id: "seo", label: "SEO" },
              { id: "options", label: "Options" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-accent text-brand-accent"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form action={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved successfully! Closing...
            </div>
          )}

          {treatment && (
            <input type="hidden" name="id" value={treatment.id} />
          )}

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Treatment Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={treatment?.title || ""}
                    required
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="e.g., Anti-Aging Facial"
                  />
                  {validationErrors.title && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={treatment?.slug || ""}
                    required
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="e.g., anti-aging-facial"
                  />
                  {validationErrors.slug && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.slug}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={treatment?.category || ""}
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="e.g., Facials, Body Treatments"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                  <select
                    name="type"
                    defaultValue={treatment?.type || "home_kit"}
                    required
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  >
                    <option value="home_kit">Home Kit</option>
                    <option value="clinic">Clinic</option>
                    <option value="campaign">Campaign</option>
                  </select>
                  {validationErrors.type && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={treatment?.price || ""}
                    required
                    step="0.01"
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="0.00"
                  />
                  {validationErrors.price && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={treatment?.display_order || 0}
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  defaultValue={treatment?.tagline || ""}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
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
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
                  placeholder="Treatment description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    defaultValue={treatment?.duration || ""}
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="e.g., 60 minutes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sessions</label>
                  <input
                    type="text"
                    name="sessions"
                    defaultValue={treatment?.sessions || ""}
                    onChange={handleFieldChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                    placeholder="e.g., 1 session"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Main Image</label>
                <ImageUpload
                  value={imageUrl}
                  onChange={(url) => { setImageUrl(url); handleFieldChange(); }}
                  folder="treatments"
                  label="Upload Main Image"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Before Image (Optional)</label>
                  <ImageUpload
                    value={beforeImageUrl}
                    onChange={(url) => { setBeforeImageUrl(url); handleFieldChange(); }}
                    folder="treatments"
                    label="Upload Before Image"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">After Image (Optional)</label>
                  <ImageUpload
                    value={afterImageUrl}
                    onChange={(url) => { setAfterImageUrl(url); handleFieldChange(); }}
                    folder="treatments"
                    label="Upload After Image"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images (Optional)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={galleryInput}
                      onChange={(e) => { setGalleryInput(e.target.value); handleFieldChange(); }}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                      placeholder="Paste image URL..."
                    />
                    <button
                      type="button"
                      onClick={addGalleryImage}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  {galleryUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {galleryUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => { removeGalleryImage(index); handleFieldChange(); }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Benefits (JSON array)
                </label>
                <textarea
                  name="benefits"
                  defaultValue={treatment?.benefits ? JSON.stringify(treatment.benefits) : "[]"}
                  rows={3}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none font-mono text-sm"
                  placeholder='["Benefit 1", "Benefit 2"]'
                />
                {validationErrors.benefits && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.benefits}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Process (JSON array)
                </label>
                <textarea
                  name="process"
                  defaultValue={treatment?.process ? JSON.stringify(treatment.process) : "[]"}
                  rows={3}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none font-mono text-sm"
                  placeholder='["Step 1", "Step 2"]'
                />
                {validationErrors.process && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.process}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Safety (JSON array)
                </label>
                <textarea
                  name="safety"
                  defaultValue={treatment?.safety ? JSON.stringify(treatment.safety) : "[]"}
                  rows={3}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none font-mono text-sm"
                  placeholder='["Safety note 1", "Safety note 2"]'
                />
                {validationErrors.safety && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.safety}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Available Cities (JSON array)
                </label>
                <textarea
                  name="available_cities"
                  defaultValue={treatment?.available_cities ? JSON.stringify(treatment.available_cities) : "[]"}
                  rows={2}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none font-mono text-sm"
                  placeholder='["Mumbai", "Delhi"]'
                />
                {validationErrors.available_cities && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.available_cities}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CTA Text
                </label>
                <input
                  type="text"
                  name="cta_text"
                  defaultValue={treatment?.cta_text || "Book Now"}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="e.g., Book Now"
                />
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SEO Title</label>
                <input
                  type="text"
                  name="seo_title"
                  defaultValue={treatment?.seo_title || ""}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="SEO page title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SEO Description</label>
                <textarea
                  name="seo_description"
                  defaultValue={treatment?.seo_description || ""}
                  rows={2}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-none"
                  placeholder="SEO meta description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SEO Keywords</label>
                <input
                  type="text"
                  name="seo_keywords"
                  defaultValue={treatment?.seo_keywords || ""}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          )}

          {/* Options Tab */}
          {activeTab === "options" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={treatment?.active ?? true}
                    onChange={handleFieldChange}
                    className="w-4 h-4 text-brand-accent rounded border-slate-300 focus:ring-brand-accent"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={treatment?.featured ?? false}
                    onChange={handleFieldChange}
                    className="w-4 h-4 text-brand-accent rounded border-slate-300 focus:ring-brand-accent"
                  />
                  <span className="text-sm font-medium text-slate-700">Featured</span>
                </label>

                <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requires_slots"
                    defaultChecked={treatment?.requires_slots ?? false}
                    onChange={handleFieldChange}
                    className="w-4 h-4 text-brand-accent rounded border-slate-300 focus:ring-brand-accent"
                  />
                  <span className="text-sm font-medium text-slate-700">Requires Slots</span>
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Sticky Save Bar */}
        <div className="border-t border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={undefined}
              onClick={() => {
                const form = document.querySelector('form[action]') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={loading || success}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : success ? "Saved!" : treatment ? "Update Treatment" : "Create Treatment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
