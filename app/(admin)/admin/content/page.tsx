"use client";

import { useState, useEffect } from "react";
import { getSiteContent, updateSiteContentBulk } from "@/lib/actions/content";
import ImageUpload from "@/components/admin/ImageUpload";

interface SectionConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "url" | "html" | "boolean";
  placeholder?: string;
  rows?: number;
}

const sectionConfigs: SectionConfig[] = [
  {
    id: "home_hero",
    name: "Hero Section",
    icon: "🏠",
    description: "Homepage hero banner with title, subtitle, and CTAs",
    fields: [
      { key: "hero_title", label: "Hero Title", type: "text", placeholder: "Transform Your Skin with Korean Beauty Science" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "text", placeholder: "Premium clinical skincare treatments" },
      { key: "hero_description", label: "Hero Description", type: "textarea", rows: 3, placeholder: "Experience doctor-supervised Korean and Japanese skincare..." },
      { key: "hero_image", label: "Hero Background Image", type: "image" },
      { key: "primary_button_text", label: "Primary Button Text", type: "text", placeholder: "Book Free Consultation" },
      { key: "primary_button_link", label: "Primary Button Link", type: "url", placeholder: "/contact" },
      { key: "secondary_button_text", label: "Secondary Button Text", type: "text", placeholder: "View All Treatments" },
      { key: "secondary_button_link", label: "Secondary Button Link", type: "url", placeholder: "/treatments" },
    ],
  },
  {
    id: "home_treatment",
    name: "Treatment Section",
    icon: "💆",
    description: "Treatment section heading and description",
    fields: [
      { key: "treatment_heading", label: "Section Heading", type: "text", placeholder: "Our Premium Treatments" },
      { key: "treatment_description", label: "Section Description", type: "textarea", rows: 2, placeholder: "Choose between premium home treatment programs..." },
    ],
  },
  {
    id: "home_membership",
    name: "Membership Section",
    icon: "👥",
    description: "Referral membership program section",
    fields: [
      { key: "membership_heading", label: "Section Heading", type: "text", placeholder: "Referral Membership Program" },
      { key: "membership_description", label: "Section Description", type: "textarea", rows: 2, placeholder: "Earn commissions by referring clients..." },
    ],
  },
  {
    id: "home_referral",
    name: "Referral Section",
    icon: "🔗",
    description: "Referral program details section",
    fields: [
      { key: "referral_heading", label: "Section Heading", type: "text", placeholder: "Grow with OZO" },
      { key: "referral_description", label: "Section Description", type: "textarea", rows: 2, placeholder: "Join our referral program and earn..." },
    ],
  },
  {
    id: "about",
    name: "About Page",
    icon: "ℹ️",
    description: "Company information and story",
    fields: [
      { key: "about_title", label: "About Title", type: "text", placeholder: "About OZO / IA Skin Care" },
      { key: "about_description", label: "About Description", type: "textarea", rows: 3, placeholder: "OZO Group brings you IA Skin Care..." },
      { key: "about_mission", label: "Mission Statement", type: "textarea", rows: 2, placeholder: "To democratize premium skincare..." },
      { key: "about_vision", label: "Vision Statement", type: "textarea", rows: 2, placeholder: "To become India's most trusted skincare destination..." },
      { key: "about_image", label: "About Page Image", type: "image" },
    ],
  },
  {
    id: "contact",
    name: "Contact Information",
    icon: "📞",
    description: "Phone, email, address, and social links",
    fields: [
      { key: "contact_phone", label: "Phone Number", type: "text", placeholder: "+91 76986 17054" },
      { key: "contact_whatsapp", label: "WhatsApp Link", type: "url", placeholder: "https://wa.me/917698617054" },
      { key: "contact_email", label: "Email Address", type: "text", placeholder: "contact@ia-skincare.com" },
      { key: "contact_address", label: "Address", type: "textarea", rows: 2, placeholder: "OZO Group, IA Skin Care Division, Ahmedabad, Gujarat" },
      { key: "contact_hours", label: "Business Hours", type: "text", placeholder: "Mon - Sat: 10:00 AM - 7:00 PM" },
    ],
  },
];

export default function AdminContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    const data = await getSiteContent();
    setContent(data);
    setLoading(false);
  }

  function handleEdit(section: SectionConfig) {
    setEditingSection(section);
    const sectionContent = content.filter((c) => c.section === section.id);
    const formData: Record<string, string> = {};
    sectionContent.forEach((c) => {
      formData[c.key_name] = c.value;
    });
    setFormData(formData);
    setSaveSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = Object.entries(formData).map(([key, value]) => {
        const item = content.find((c) => c.key_name === key);
        return { id: item?.id, value };
      });
      await updateSiteContentBulk(updates);
      await loadContent();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save content. Please try again.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (editingSection) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditingSection(null)}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{editingSection.name}</h1>
            <p className="text-slate-600">{editingSection.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-900">Section Content</h2>
            <p className="text-sm text-slate-600 mt-1">Edit the content below. Changes will be reflected immediately on the website.</p>
          </div>

          <div className="p-6 space-y-6">
            {editingSection.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {field.label}
                </label>
                {field.type === "image" ? (
                  <div className="space-y-2">
                    <ImageUpload
                      value={formData[field.key] || ""}
                      onChange={(url) => setFormData({ ...formData, [field.key]: url })}
                      folder="cms"
                      label="Upload Image"
                    />
                    <input
                      type="url"
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                      placeholder="Or paste image URL..."
                    />
                  </div>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent min-h-[120px] resize-y"
                    rows={field.rows || 3}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "url" ? (
                  <input
                    type="url"
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Saved successfully!</span>
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => setEditingSection(null)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-lg hover:shadow-glow transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Website CMS</h1>
        <p className="text-slate-600 mt-1">Manage all website content sections. Changes reflect instantly on the live site.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectionConfigs.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl shadow-lg border border-slate-200 hover:border-brand-accent hover:shadow-xl transition-all duration-200 group"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl group-hover:scale-110 transition-transform">{section.icon}</span>
                <div>
                  <h2 className="font-semibold text-slate-900">{section.name}</h2>
                  <p className="text-sm text-slate-600 mt-0.5">{section.description}</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-4">
                {section.fields.length} field{section.fields.length !== 1 ? "s" : ""} editable
              </div>
              <button
                onClick={() => handleEdit(section)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all"
              >
                Edit Section
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
