"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Image as ImageIcon, Pencil, Plus, Search, Settings2, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import ImageUpload from "@/components/admin/ImageUpload";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SiteContent = {
  id: string;
  page?: string | null;
  section: string;
  content_key?: string | null;
  key_name: string;
  value: string | null;
  content_value?: unknown;
  value_type?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
};

type ContentField = {
  label: string;
  page: string;
  section: string;
  key: string;
  aliases?: string[];
  type?: "text" | "textarea" | "image_url" | "link";
  rows?: number;
  placeholder?: string;
};

type ContentGroup = {
  title: string;
  description: string;
  page: string;
  section: string;
  fields: ContentField[];
};

const contentGroups: ContentGroup[] = [
  {
    title: "Home Hero",
    description: "Main first-screen copy, primary CTA, and hero image.",
    page: "home",
    section: "home_hero",
    fields: [
      { label: "Hero Title", page: "home", section: "home_hero", key: "hero_title", aliases: ["title"], type: "textarea", rows: 2 },
      { label: "Hero Subtitle", page: "home", section: "home_hero", key: "hero_subtitle", aliases: ["subtitle"], type: "textarea", rows: 2 },
      { label: "Hero Description", page: "home", section: "home_hero", key: "hero_description", aliases: ["description"], type: "textarea", rows: 4 },
      { label: "Primary Button Text", page: "home", section: "home_hero", key: "primary_button_text", aliases: ["cta_text"], type: "text" },
      { label: "Primary Button Link", page: "home", section: "home_hero", key: "primary_button_link", aliases: ["cta_link"], type: "link" },
      { label: "Hero Image", page: "home", section: "home_hero", key: "hero_image", aliases: ["image"], type: "image_url" },
    ],
  },
  {
    title: "Treatments Section",
    description: "Heading and intro text above the public treatment cards.",
    page: "home",
    section: "home_treatment",
    fields: [
      { label: "Section Heading", page: "home", section: "home_treatment", key: "treatment_heading", aliases: ["heading"], type: "text" },
      { label: "Section Subtitle", page: "home", section: "home_treatment", key: "treatment_subtitle", aliases: ["subtitle"], type: "textarea", rows: 2 },
      { label: "Treatment Intro Text", page: "home", section: "home_treatment", key: "treatment_description", aliases: ["description"], type: "textarea", rows: 3 },
    ],
  },
  {
    title: "Membership / Referral Section",
    description: "Partner membership and referral CTA copy.",
    page: "home",
    section: "home_membership",
    fields: [
      { label: "Heading", page: "home", section: "home_membership", key: "membership_heading", aliases: ["heading"], type: "text" },
      { label: "Description", page: "home", section: "home_membership", key: "membership_description", aliases: ["description", "subtitle"], type: "textarea", rows: 3 },
      { label: "CTA Text", page: "home", section: "home_membership", key: "membership_cta_text", aliases: ["cta_text"], type: "text" },
      { label: "CTA Link", page: "home", section: "home_membership", key: "membership_cta_link", aliases: ["cta_link"], type: "link" },
    ],
  },
  {
    title: "About Section",
    description: "About page copy, mission, vision, and supporting image.",
    page: "about",
    section: "about",
    fields: [
      { label: "About Title", page: "about", section: "about", key: "about_title", aliases: ["title"], type: "text" },
      { label: "About Content", page: "about", section: "about", key: "about_description", aliases: ["description"], type: "textarea", rows: 4 },
      { label: "Mission", page: "about", section: "about", key: "about_mission", aliases: ["mission"], type: "textarea", rows: 3 },
      { label: "Vision", page: "about", section: "about", key: "about_vision", aliases: ["vision"], type: "textarea", rows: 3 },
      { label: "About Image", page: "about", section: "about", key: "about_image", aliases: ["image"], type: "image_url" },
    ],
  },
  {
    title: "Contact / Footer",
    description: "Public contact and footer details.",
    page: "contact",
    section: "contact",
    fields: [
      { label: "Phone", page: "contact", section: "contact", key: "phone", type: "text" },
      { label: "WhatsApp", page: "contact", section: "contact", key: "whatsapp", type: "text" },
      { label: "Email", page: "contact", section: "contact", key: "email", type: "text" },
      { label: "Address", page: "contact", section: "contact", key: "address", type: "textarea", rows: 3 },
      { label: "Footer Text", page: "contact", section: "footer", key: "footer_text", aliases: ["description"], type: "textarea", rows: 3 },
    ],
  },
];

const allDefinitions = contentGroups.flatMap((group) => group.fields);

function getItemKey(item: SiteContent) {
  return item.content_key || item.key_name;
}

function getItemValue(item?: SiteContent | null) {
  if (!item) return "";
  if (typeof item.value === "string") return item.value;
  if (typeof item.content_value === "string") return item.content_value;
  if (item.content_value == null) return "";
  try {
    return JSON.stringify(item.content_value);
  } catch {
    return "";
  }
}

function getFieldKeys(field: ContentField) {
  return [field.key, ...(field.aliases || [])];
}

function findContentItem(content: SiteContent[], field: ContentField) {
  const keys = getFieldKeys(field);
  return content.find((item) => item.section === field.section && keys.includes(getItemKey(item)));
}

function humanize(value?: string | null) {
  return (value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminContentPage() {
  const supabase = getSupabaseBrowserClient();
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAdvancedList, setShowAdvancedList] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    page: "home",
    section: "home_hero",
    content_key: "",
    key_name: "",
    value: "",
    value_type: "text",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("site_content")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error loading content:", error);
      setContent([]);
      showToast("error", "Unable to load website content.");
    } else {
      setContent(Array.isArray(data) ? (data as SiteContent[]) : []);
    }
    setLoading(false);
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 4500);
  }

  function openFieldEditor(field: ContentField, item?: SiteContent | null) {
    setEditingContent(item || null);
    setAdvancedMode(false);
    setFormData({
      page: item?.page || field.page,
      section: item?.section || field.section,
      content_key: item?.content_key || field.key,
      key_name: item?.key_name || field.key,
      value: getItemValue(item),
      value_type: item?.value_type || field.type || "text",
      display_order: item?.display_order || allDefinitions.findIndex((definition) => definition.key === field.key) + 1,
      is_active: item?.is_active ?? true,
    });
    setShowModal(true);
  }

  function openAdvancedEditor(item?: SiteContent | null) {
    setEditingContent(item || null);
    setAdvancedMode(true);
    setFormData({
      page: item?.page || "home",
      section: item?.section || "home_hero",
      content_key: item?.content_key || "",
      key_name: item?.key_name || "",
      value: getItemValue(item),
      value_type: item?.value_type || "text",
      display_order: item?.display_order || 0,
      is_active: item?.is_active ?? true,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const valueType = formData.value_type || "text";
    const payload = {
      page: formData.page || "home",
      section: formData.section,
      content_key: formData.content_key || formData.key_name,
      key_name: formData.key_name || formData.content_key,
      value: formData.value,
      value_type: valueType,
      display_order: formData.display_order,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingContent) {
        const { error } = await (supabase as any)
          .from("site_content")
          .update(payload)
          .eq("id", editingContent.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("site_content").insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingContent(null);
      await loadContent();
      showToast("success", "Website content saved.");
    } catch (err) {
      console.error("Error saving content:", err);
      showToast("error", "Unable to save content. Please check your admin access and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content item?")) return;

    const { error } = await (supabase as any).from("site_content").delete().eq("id", id);
    if (error) {
      console.error("Error deleting content:", error);
      showToast("error", "Unable to delete content.");
      return;
    }
    await loadContent();
    showToast("success", "Content deleted.");
  }

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contentGroups;
    return contentGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) =>
          [group.title, group.description, field.label, field.key, ...(field.aliases || [])]
            .join(" ")
            .toLowerCase()
            .includes(query)
        ),
      }))
      .filter((group) => group.fields.length > 0);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[100] max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      <Breadcrumb items={[{ label: "Website Content" }]} />
      <PageHeader
        title="Website Content"
        description="Edit website copy section-by-section. Changes save to Supabase and appear on the website after refresh."
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" icon={<Settings2 className="w-4 h-4" />} onClick={() => setShowAdvancedList((value) => !value)}>
              Advanced
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => openAdvancedEditor()}>
              Add Content
            </Button>
          </div>
        }
      />

      <Card noPadding>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search section or field..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/40 focus:bg-white"
            />
          </div>
          <span className="text-xs text-slate-500">
            {content.length} saved items
          </span>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="py-16 text-center text-sm text-slate-500">Loading website content...</div>
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No matching content sections" description="Clear the search to see all editable sections." />
        </Card>
      ) : (
        <div className="grid gap-5">
          {filteredGroups.map((group) => (
            <Card key={group.title} noPadding>
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-brand-ink">{group.title}</h2>
                  <p className="text-sm text-brand-muted mt-1">{group.description}</p>
                </div>
                <Badge variant="neutral">{humanize(group.section)}</Badge>
              </div>

              <div className="divide-y divide-slate-100">
                {group.fields.map((field) => {
                  const item = findContentItem(content, field);
                  const value = getItemValue(item);
                  return (
                    <div key={`${field.section}-${field.key}`} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="lg:w-64 shrink-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-brand-ink">{field.label}</p>
                          {field.type === "image_url" && <ImageIcon className="w-4 h-4 text-slate-400" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {item ? "Connected to website" : "Not added yet"}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        {field.type === "image_url" && value ? (
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={value} alt={field.label} className="w-20 h-20 rounded-lg border border-slate-200 object-cover bg-slate-50" />
                            <p className="text-sm text-slate-600 truncate">{value}</p>
                          </div>
                        ) : (
                          <p className={`text-sm leading-relaxed ${value ? "text-slate-700" : "text-slate-400 italic"}`}>
                            {value || "No value set"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 lg:justify-end">
                        {item && (
                          <Badge variant={item.is_active ?? true ? "success" : "neutral"} dot>
                            {item.is_active ?? true ? "Active" : "Inactive"}
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => openFieldEditor(field, item)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-brand-ink hover:border-brand-accent hover:text-brand-accent transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          {item ? "Edit" : "Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdvancedList && (
        <Card noPadding>
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-brand-ink">Advanced Content Items</h2>
            <p className="text-sm text-brand-muted mt-1">Use this only when a section-specific field is missing or needs technical correction.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Page</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Key</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {content.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-slate-900">{humanize(item.key_name)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{item.page || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{item.section}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{getItemKey(item)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openAdvancedEditor(item)} className="p-2 text-slate-500 hover:text-brand-accent hover:bg-slate-100 rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-brand-ink/55 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-ink">
                  {editingContent ? "Edit Website Content" : "Add Website Content"}
                </h2>
                <p className="text-xs text-brand-muted mt-1">
                  {advancedMode ? "Advanced fields are visible." : "Editing a section field."}
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); setEditingContent(null); }}
                className="p-2 text-brand-muted hover:text-brand-ink"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <label className="flex items-center gap-2 text-sm text-brand-ink">
                <input
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                  className="rounded border-brand-border"
                />
                Show advanced technical fields
              </label>

              {advancedMode && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput label="Page" value={formData.page} onChange={(value) => setFormData({ ...formData, page: value })} required />
                  <TextInput label="Section" value={formData.section} onChange={(value) => setFormData({ ...formData, section: value })} required />
                  <TextInput label="Content Key" value={formData.content_key} onChange={(value) => setFormData({ ...formData, content_key: value })} required />
                  <TextInput label="Display Label" value={formData.key_name} onChange={(value) => setFormData({ ...formData, key_name: value })} required />
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1">Value Type</label>
                    <select
                      value={formData.value_type}
                      onChange={(e) => setFormData({ ...formData, value_type: e.target.value })}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="image_url">Image URL</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                  <TextInput label="Display Order" type="number" value={String(formData.display_order)} onChange={(value) => setFormData({ ...formData, display_order: Number(value) || 0 })} />
                </div>
              )}

              {formData.value_type === "image_url" ? (
                <ImageUpload
                  value={formData.value}
                  onChange={(url) => setFormData({ ...formData, value: url })}
                  folder="content"
                  label="Image"
                />
              ) : formData.value_type === "textarea" ? (
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Content</label>
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none resize-y"
                  />
                </div>
              ) : (
                <TextInput label="Content" value={formData.value} onChange={(value) => setFormData({ ...formData, value })} required />
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-brand-border"
                />
                <span className="text-sm text-brand-ink">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingContent(null); }}
                  className="px-4 py-2 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-muted transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Content"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-ink mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
      />
    </div>
  );
}
