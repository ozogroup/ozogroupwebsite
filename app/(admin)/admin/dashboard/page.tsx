import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";
import Link from "next/link";
import DirectSelectTest from "../system-health/DirectSelectTest";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  
  // Get user info
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get Supabase config info
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Fetch real counts from Supabase with detailed error info
  const tableResults: Record<string, { count: number | null; error: { message: string | null; code: string | null; details: string | null } }> = {
    treatments: { count: null, error: { message: null, code: null, details: null } },
    testimonials: { count: null, error: { message: null, code: null, details: null } },
    faqs: { count: null, error: { message: null, code: null, details: null } },
    site_content: { count: null, error: { message: null, code: null, details: null } },
    contact_settings: { count: null, error: { message: null, code: null, details: null } },
  };

  const [treatmentsResult, testimonialsResult, faqsResult, siteContentResult, contactSettingsResult] = await Promise.all([
    (supabase as any).from("treatments").select("*", { count: "exact", head: true }),
    (supabase as any).from("testimonials").select("*", { count: "exact", head: true }),
    (supabase as any).from("faqs").select("*", { count: "exact", head: true }),
    (supabase as any).from("site_content").select("*", { count: "exact", head: true }),
    (supabase as any).from("contact_settings").select("*", { count: "exact", head: true }),
  ]);

  tableResults.treatments = {
    count: treatmentsResult.count,
    error: {
      message: treatmentsResult.error?.message || null,
      code: treatmentsResult.error?.code || null,
      details: treatmentsResult.error?.details || null,
    }
  };
  tableResults.testimonials = {
    count: testimonialsResult.count,
    error: {
      message: testimonialsResult.error?.message || null,
      code: testimonialsResult.error?.code || null,
      details: testimonialsResult.error?.details || null,
    }
  };
  tableResults.faqs = {
    count: faqsResult.count,
    error: {
      message: faqsResult.error?.message || null,
      code: faqsResult.error?.code || null,
      details: faqsResult.error?.details || null,
    }
  };
  tableResults.site_content = {
    count: siteContentResult.count,
    error: {
      message: siteContentResult.error?.message || null,
      code: siteContentResult.error?.code || null,
      details: siteContentResult.error?.details || null,
    }
  };
  tableResults.contact_settings = {
    count: contactSettingsResult.count,
    error: {
      message: contactSettingsResult.error?.message || null,
      code: contactSettingsResult.error?.code || null,
      details: contactSettingsResult.error?.details || null,
    }
  };

  const treatmentsCount = tableResults.treatments.count;
  const testimonialsCount = tableResults.testimonials.count;
  const faqsCount = tableResults.faqs.count;
  const siteContentCount = tableResults.site_content.count;
  const contactSettingsCount = tableResults.contact_settings.count;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Dashboard</h1>
        <p className="text-brand-muted">Overview of your website content</p>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">DEBUG OUTPUT</h2>
        
        <div>
          <p className="text-gray-400">Supabase URL (first 35 chars):</p>
          <p className="text-green-400">{supabaseUrl.substring(0, 35)}</p>
        </div>
        
        <div>
          <p className="text-gray-400">Anon key exists:</p>
          <p className={supabaseAnonKey ? "text-green-400" : "text-red-400"}>{supabaseAnonKey ? "true" : "false"}</p>
        </div>
        
        <div>
          <p className="text-gray-400">Logged-in user email:</p>
          <p className="text-green-400">{user?.email || "none"}</p>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <h3 className="text-white font-semibold">Table Query Results:</h3>
          {Object.entries(tableResults).map(([tableName, result]) => (
            <div key={tableName} className="bg-gray-800 rounded p-3">
              <p className="text-yellow-400 font-semibold">{tableName}:</p>
              <p className="text-gray-300">Count: {result.count !== null ? result.count : "null"}</p>
              {result.error.message && (
                <>
                  <p className="text-red-400">Error message: {result.error.message}</p>
                  <p className="text-red-400">Error code: {result.error.code || "null"}</p>
                  <p className="text-red-400">Error details: {result.error.details || "null"}</p>
                </>
              )}
            </div>
          ))}
        </div>
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

      {/* Direct Select Test */}
      <DirectSelectTest />
    </div>
  );
}
