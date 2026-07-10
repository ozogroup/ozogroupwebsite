"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/admin/Breadcrumb";
import TreatmentImageManager, {
  ExistingTreatmentImage,
  PendingTreatmentImage,
} from "@/components/admin/TreatmentImageManager";
import { ensureFinalTreatmentCatalog, getAdminTreatmentsWithImages, saveTreatmentWithImages } from "@/lib/actions/treatments";
import { treatmentKitSlugs } from "@/lib/treatments/catalog";
import { getOfferingTypeLabel } from "@/lib/treatment-labels";

type Treatment = {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  price_label?: string;
  kit_name?: string;
  unit?: string;
  subtitle?: string;
  description?: string;
  overview?: string;
  treatment_type?: string;
  image?: string;
  image_alt?: string;
  active: boolean;
  featured?: boolean;
  gallery?: string[];
  duration?: string;
  sessions?: string;
  badge?: string;
  benefits?: string[];
  safety?: string;
  available_cities?: string[];
  cta_text?: string;
  who_for?: string[] | string;
  process?: Array<{ step?: string; detail?: string }>;
  faqs?: Array<{ q?: string; a?: string }>;
  seo_title?: string;
  seo_description?: string;
  sort_order?: number;
  treatment_images?: ExistingTreatmentImage[];
};

type FormState = {
  title: string;
  slug: string;
  type: string;
  price: string;
  price_label: string;
  kit_name: string;
  unit: string;
  subtitle: string;
  description: string;
  overview: string;
  image_alt: string;
  duration: string;
  sessions: string;
  badge: string;
  benefits: string;
  safety: string;
  available_cities: string;
  cta_text: string;
  active: boolean;
  featured: boolean;
  who_for: string;
  process: string;
  faqs: string;
  seo_title: string;
  seo_description: string;
  sort_order: string;
};

const emptyForm: FormState = {
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
  who_for: "",
  process: "",
  faqs: "",
  seo_title: "",
  seo_description: "",
  sort_order: "",
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseProcess(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [step, ...rest] = line.split("|");
      return { step: step.trim(), detail: rest.join("|").trim() };
    });
}

function parseFaqs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [q, ...rest] = line.split("|");
      return { q: q.trim(), a: rest.join("|").trim() };
    });
}

function imagesFromTreatment(treatment: Treatment): ExistingTreatmentImage[] {
  if (Array.isArray(treatment.treatment_images) && treatment.treatment_images.length > 0) {
    return treatment.treatment_images
      .map((image, index) => ({
        ...image,
        sort_order: Number(image.sort_order ?? index),
        alt_text: image.alt_text || treatment.image_alt || treatment.title,
      }))
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.sort_order - b.sort_order;
      });
  }

  const urls = Array.from(new Set([treatment.image, ...(treatment.gallery || [])].filter(Boolean))) as string[];
  return urls.map((url, index) => ({
    id: `legacy-${index}-${url}`,
    public_url: url,
    storage_path: null,
    alt_text: treatment.image_alt || treatment.title,
    sort_order: index,
    is_primary: index === 0,
  }));
}

function formFromTreatment(treatment: Treatment): FormState {
  return {
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
    image_alt: treatment.image_alt || treatment.title || "",
    duration: treatment.duration || "",
    sessions: treatment.sessions || "",
    badge: treatment.badge || "",
    benefits: Array.isArray(treatment.benefits) ? treatment.benefits.join(", ") : "",
    safety: treatment.safety || "",
    available_cities: Array.isArray(treatment.available_cities) ? treatment.available_cities.join(", ") : "",
    cta_text: treatment.cta_text || "Book Now",
    active: treatment.active ?? true,
    featured: treatment.featured ?? false,
    who_for: Array.isArray(treatment.who_for) ? treatment.who_for.join(", ") : String(treatment.who_for || ""),
    process: Array.isArray(treatment.process)
      ? treatment.process.map((step) => `${step.step || ""} | ${step.detail || ""}`).join("\n")
      : "",
    faqs: Array.isArray(treatment.faqs)
      ? treatment.faqs.map((faq) => `${faq.q || ""} | ${faq.a || ""}`).join("\n")
      : "",
    seo_title: treatment.seo_title || "",
    seo_description: treatment.seo_description || "",
    sort_order: treatment.sort_order?.toString() || "",
  };
}

export default function AdminTreatmentsPage() {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [existingImages, setExistingImages] = useState<ExistingTreatmentImage[]>([]);
  const [removedImages, setRemovedImages] = useState<ExistingTreatmentImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingTreatmentImage[]>([]);
  const [primaryImageKey, setPrimaryImageKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, startSyncTransition] = useTransition();
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadTreatments();
  }, []);

  const sortedTreatments = useMemo(
    () =>
      [...treatments].sort(
        (a, b) =>
          ((treatmentKitSlugs.indexOf(a.slug as any) + 1) || 999) -
          ((treatmentKitSlugs.indexOf(b.slug as any) + 1) || 999)
      ),
    [treatments]
  );

  async function loadTreatments() {
    setLoading(true);
    const result = await getAdminTreatmentsWithImages();
    if (result.error) {
      setTreatments([]);
      showToast("error", result.error);
    } else {
      setTreatments((result.data || []) as Treatment[]);
    }
    setLoading(false);
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setFormData(emptyForm);
    setExistingImages([]);
    setRemovedImages([]);
    setPendingImages([]);
    setPrimaryImageKey("");
    setImageError("");
    setError("");
  }

  function handleAdd() {
    resetForm();
    setEditingTreatment(null);
    setShowModal(true);
  }

  function handleEdit(treatment: Treatment) {
    const images = imagesFromTreatment(treatment);
    setEditingTreatment(treatment);
    setFormData(formFromTreatment(treatment));
    setExistingImages(images);
    setRemovedImages([]);
    setPendingImages([]);
    setPrimaryImageKey(images.find((image) => image.is_primary)?.id ? `existing:${images.find((image) => image.is_primary)?.id}` : images[0] ? `existing:${images[0].id}` : "");
    setImageError("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingTreatment(null);
    resetForm();
  }

  function handleSyncFinalTreatments() {
    setError("");
    startSyncTransition(async () => {
      const result = await ensureFinalTreatmentCatalog();
      if (result?.error) {
        setError(result.error);
        showToast("error", result.error);
        return;
      }
      await loadTreatments();
      router.refresh();
      showToast("success", "Final treatment catalog synced.");
    });
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setImageError("");

    const payload = new FormData();
    if (editingTreatment?.id) payload.append("id", editingTreatment.id);
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === "boolean") payload.append(key, value ? "true" : "false");
      else payload.append(key, value);
    });

    payload.set("benefits", JSON.stringify(splitList(formData.benefits)));
    payload.set("available_cities", JSON.stringify(splitList(formData.available_cities)));
    payload.set("who_for", JSON.stringify(splitList(formData.who_for)));
    payload.set("process", JSON.stringify(parseProcess(formData.process)));
    payload.set("faqs", JSON.stringify(parseFaqs(formData.faqs)));
    payload.set("existingImages", JSON.stringify(existingImages.map((image, index) => ({
      ...image,
      sort_order: index,
      is_primary: primaryImageKey === `existing:${image.id}`,
    }))));
    payload.set("removedImages", JSON.stringify(removedImages));
    payload.set("newImageAltTexts", JSON.stringify(pendingImages.map((image) => image.alt_text)));
    payload.set("primaryImageKey", primaryImageKey);
    pendingImages.forEach((image) => payload.append("newImages", image.file));

    const result = await saveTreatmentWithImages(payload);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setImageError(result.error);
      showToast("error", result.error);
      return;
    }

    showToast("success", "Treatment saved and website cache refreshed.");
    setShowModal(false);
    setEditingTreatment(null);
    resetForm();
    await loadTreatments();
    router.refresh();
  }

  async function handleDisable(treatment: Treatment) {
    const payload = new FormData();
    const nextForm = { ...formFromTreatment(treatment), active: false };
    const images = imagesFromTreatment(treatment);
    payload.append("id", treatment.id);
    Object.entries(nextForm).forEach(([key, value]) => {
      if (typeof value === "boolean") payload.append(key, value ? "true" : "false");
      else payload.append(key, value);
    });
    payload.set("benefits", JSON.stringify(splitList(nextForm.benefits)));
    payload.set("available_cities", JSON.stringify(splitList(nextForm.available_cities)));
    payload.set("who_for", JSON.stringify(splitList(nextForm.who_for)));
    payload.set("process", JSON.stringify(parseProcess(nextForm.process)));
    payload.set("faqs", JSON.stringify(parseFaqs(nextForm.faqs)));
    payload.set("existingImages", JSON.stringify(images));
    payload.set("removedImages", "[]");
    payload.set("newImageAltTexts", "[]");
    payload.set("primaryImageKey", images[0] ? `existing:${images[0].id}` : "");

    const result = await saveTreatmentWithImages(payload);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    await loadTreatments();
    router.refresh();
    showToast("success", "Treatment disabled.");
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed right-6 top-20 z-[100] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      <Breadcrumb items={[{ label: "Treatments" }]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Treatments</h1>
          <p className="text-brand-muted">Manage the live kit and treatment catalog shown on the website.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleSyncFinalTreatments}
            disabled={syncing}
            className="rounded-lg border border-brand-border px-4 py-2 text-brand-ink transition-colors hover:border-brand-accent hover:text-brand-accent disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Sync Final 5"}
          </button>
          <button
            onClick={handleAdd}
            className="rounded-lg bg-brand-ink px-4 py-2 text-white transition-colors hover:bg-brand-muted"
          >
            Add Treatment
          </button>
        </div>
      </div>

      {error && !showModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-brand-border bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">Treatment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">Featured</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-brand-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-brand-muted">Loading...</td>
                </tr>
              ) : sortedTreatments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="font-medium text-brand-ink">No treatments found</p>
                    <p className="mt-1 text-sm text-brand-muted">Supabase has no treatment records yet.</p>
                    <button
                      onClick={handleSyncFinalTreatments}
                      disabled={syncing}
                      className="mt-4 rounded-lg bg-brand-ink px-4 py-2 text-white transition-colors hover:bg-brand-muted"
                    >
                      {syncing ? "Syncing..." : "Seed Final 5 Treatments"}
                    </button>
                  </td>
                </tr>
              ) : (
                sortedTreatments.map((treatment) => (
                  <tr key={treatment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {treatment.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={treatment.image}
                          alt={treatment.title}
                          className="h-12 w-12 rounded-lg border border-brand-border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-ink">{treatment.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{treatment.description || treatment.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-brand-light/55 px-2 py-1 text-xs text-brand-primaryDark">
                        {getOfferingTypeLabel(treatment.type || treatment.treatment_type)}
                      </span>
                      <p className="mt-1 text-xs text-brand-muted">{treatment.kit_name || treatment.title}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-ink">
                      {treatment.price_label || `Rs. ${Number(treatment.price || 0).toLocaleString("en-IN")}`}
                      {treatment.unit && <p className="mt-1 text-xs font-normal text-brand-muted">{treatment.unit}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${treatment.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {treatment.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${treatment.featured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {treatment.featured ? "Featured" : "Normal"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(treatment)}
                          className="rounded p-1 text-brand-muted hover:text-brand-accent"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDisable(treatment)}
                          className="rounded p-1 text-brand-muted hover:text-red-600"
                          title="Disable"
                        >
                          Disable
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/55 p-3 sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-brand-border p-4">
              <h2 className="text-lg font-bold text-brand-ink">
                {editingTreatment ? "Edit Treatment" : "Add Treatment"}
              </h2>
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded p-1 text-brand-muted hover:text-brand-ink disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                {error && (
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Title *" value={formData.title} onChange={(value) => update("title", value)} required />
                  <FormInput label="Slug *" value={formData.slug} onChange={(value) => update("slug", value)} required />
                </div>

                <TreatmentImageManager
                  existingImages={existingImages}
                  pendingImages={pendingImages}
                  primaryImageKey={primaryImageKey}
                  saving={saving}
                  error={imageError}
                  onExistingImagesChange={setExistingImages}
                  onPendingImagesChange={setPendingImages}
                  onRemovedExistingImage={(image) => setRemovedImages((current) => [...current, image])}
                  onPrimaryImageKeyChange={setPrimaryImageKey}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-brand-ink">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(event) => update("type", event.target.value)}
                      required
                      className="w-full rounded-lg border border-brand-border px-3 py-2 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                    >
                      <option value="clinic">Treatment</option>
                      <option value="home_kit">Kit</option>
                      <option value="campaign">Campaign</option>
                    </select>
                  </div>
                  <FormInput label="Price *" type="number" value={formData.price} onChange={(value) => update("price", value)} required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Price Label" value={formData.price_label} onChange={(value) => update("price_label", value)} placeholder="Rs. 18,000" />
                  <FormInput label="Kit Name" value={formData.kit_name} onChange={(value) => update("kit_name", value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Unit" value={formData.unit} onChange={(value) => update("unit", value)} placeholder="per session" />
                  <FormInput label="Image Alt Text" value={formData.image_alt} onChange={(value) => update("image_alt", value)} />
                </div>

                <FormInput label="Subtitle" value={formData.subtitle} onChange={(value) => update("subtitle", value)} />
                <FormTextarea label="Description" value={formData.description} onChange={(value) => update("description", value)} rows={3} />
                <FormTextarea label="Overview" value={formData.overview} onChange={(value) => update("overview", value)} rows={3} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Duration" value={formData.duration} onChange={(value) => update("duration", value)} placeholder="60 min" />
                  <FormInput label="Sessions" value={formData.sessions} onChange={(value) => update("sessions", value)} placeholder="1 session" />
                </div>

                <FormInput label="Badge" value={formData.badge} onChange={(value) => update("badge", value)} placeholder="Premium" />
                <FormTextarea label="Benefits (comma-separated)" value={formData.benefits} onChange={(value) => update("benefits", value)} rows={3} />
                <FormTextarea label="Safety" value={formData.safety} onChange={(value) => update("safety", value)} rows={2} />
                <FormInput label="Available Cities (comma-separated)" value={formData.available_cities} onChange={(value) => update("available_cities", value)} />
                <FormInput label="CTA Text" value={formData.cta_text} onChange={(value) => update("cta_text", value)} />
                <FormInput label="Who is it for? (comma-separated)" value={formData.who_for} onChange={(value) => update("who_for", value)} />
                <FormTextarea label="Process steps (one per line, format: Step | Detail)" value={formData.process} onChange={(value) => update("process", value)} rows={3} />
                <FormTextarea label="FAQs (one per line, format: Question | Answer)" value={formData.faqs} onChange={(value) => update("faqs", value)} rows={3} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Sort Order" type="number" value={formData.sort_order} onChange={(value) => update("sort_order", value)} />
                  <FormInput label="SEO Title" value={formData.seo_title} onChange={(value) => update("seo_title", value)} />
                </div>
                <FormTextarea label="SEO Description" value={formData.seo_description} onChange={(value) => update("seo_description", value)} rows={2} />

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-brand-ink">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(event) => update("active", event.target.checked)}
                      className="rounded border-brand-border"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-brand-ink">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(event) => update("featured", event.target.checked)}
                      className="rounded border-brand-border"
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-brand-border bg-white p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-brand-border px-4 py-2 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-ink px-4 py-2 text-white transition-colors hover:bg-brand-muted disabled:opacity-50"
                >
                  {saving ? "Uploading and saving..." : editingTreatment ? "Update Treatment" : "Create Treatment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        className="w-full rounded-lg border border-brand-border px-3 py-2 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
      />
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-ink">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-lg border border-brand-border px-3 py-2 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
      />
    </div>
  );
}
