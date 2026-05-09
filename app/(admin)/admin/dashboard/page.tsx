import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  // Fetch real counts from Supabase
  const [
    { count: treatmentsCount },
    { count: testimonialsCount },
    { count: faqsCount },
    { count: siteContentCount },
    { count: contactSettingsCount },
  ] = await Promise.all([
    supabase.from("treatments" as any).select("*", { count: "exact", head: true }),
    (supabase as any).from("testimonials").select("*", { count: "exact", head: true }),
    (supabase as any).from("faqs").select("*", { count: "exact", head: true }),
    (supabase as any).from("site_content").select("*", { count: "exact", head: true }),
    supabase.from("contact_settings").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Dashboard</h1>
        <p className="text-brand-muted">Overview of your website content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💆</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(treatmentsCount ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {(treatmentsCount ?? 0) > 0 ? "Active" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-brand-ink">{treatmentsCount ?? 0}</h3>
          <p className="text-sm text-brand-muted">Treatments</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(testimonialsCount ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {(testimonialsCount ?? 0) > 0 ? "Active" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-brand-ink">{testimonialsCount ?? 0}</h3>
          <p className="text-sm text-brand-muted">Testimonials</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❓</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(faqsCount ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {(faqsCount ?? 0) > 0 ? "Active" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-brand-ink">{faqsCount ?? 0}</h3>
          <p className="text-sm text-brand-muted">FAQs</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(siteContentCount ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {(siteContentCount ?? 0) > 0 ? "Active" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-brand-ink">{siteContentCount ?? 0}</h3>
          <p className="text-sm text-brand-muted">Content Items</p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📞</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(contactSettingsCount ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {(contactSettingsCount ?? 0) > 0 ? "Active" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-brand-ink">{contactSettingsCount ?? 0}</h3>
          <p className="text-sm text-brand-muted">Contact Settings</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <h2 className="text-lg font-semibold text-brand-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/admin/treatments"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-slate-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2">💆</span>
            <span className="text-sm font-medium text-brand-ink">Manage Treatments</span>
          </Link>
          <Link
            href="/admin/testimonials"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-slate-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2">⭐</span>
            <span className="text-sm font-medium text-brand-ink">Manage Testimonials</span>
          </Link>
          <Link
            href="/admin/faqs"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-slate-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2">❓</span>
            <span className="text-sm font-medium text-brand-ink">Manage FAQs</span>
          </Link>
          <Link
            href="/admin/content"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-slate-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2">📝</span>
            <span className="text-sm font-medium text-brand-ink">Edit Website Content</span>
          </Link>
          <Link
            href="/admin/contact"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-slate-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2">📞</span>
            <span className="text-sm font-medium text-brand-ink">Contact Settings</span>
          </Link>
          <Link
            href="/admin/system-health"
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-slate-50 transition-colors text-center"
          >
            <span className="text-2xl mb-2">🏥</span>
            <span className="text-sm font-medium text-brand-ink">System Health</span>
          </Link>
        </div>
      </div>

      {/* Empty State Message */}
      {((treatmentsCount ?? 0) === 0 || (testimonialsCount ?? 0) === 0 || (faqsCount ?? 0) === 0 || (siteContentCount ?? 0) === 0 || (contactSettingsCount ?? 0) === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Data Missing</h3>
          <p className="text-sm text-yellow-800">
            Some tables are empty. Run the SEED_DATA.sql in Supabase SQL Editor to populate initial data.
          </p>
        </div>
      )}
    </div>
  );
}
