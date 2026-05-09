import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function refreshHealth() {
  "use server";
  revalidatePath("/admin/system-health");
  redirect("/admin/system-health");
}

export default async function SystemHealthPage() {
  const supabase = getSupabaseServerClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }

  // Test Supabase connection and get counts
  let connectionStatus = "unknown";
  let connectionError = null;
  
  const counts = {
    treatments: 0,
    testimonials: 0,
    faqs: 0,
    site_content: 0,
    contact_settings: 0,
  };

  try {
    // Test connection by querying a simple table
    const { error: connectionTestError } = await supabase.from("treatments").select("id").limit(1);
    
    if (connectionTestError) {
      connectionStatus = "error";
      connectionError = connectionTestError.message;
    } else {
      connectionStatus = "connected";
      
      // Get counts - use any() to bypass strict typing for tables not in types
      const [treatmentsCount, testimonialsCount, faqsCount, siteContentCount, contactSettingsCount] = await Promise.all([
        supabase.from("treatments").select("*", { count: "exact", head: true }),
        (supabase as any).from("testimonials").select("*", { count: "exact", head: true }),
        (supabase as any).from("faqs").select("*", { count: "exact", head: true }),
        (supabase as any).from("site_content").select("*", { count: "exact", head: true }),
        supabase.from("contact_settings").select("*", { count: "exact", head: true }),
      ]);

      counts.treatments = treatmentsCount.count || 0;
      counts.testimonials = testimonialsCount.count || 0;
      counts.faqs = faqsCount.count || 0;
      counts.site_content = siteContentCount.count || 0;
      counts.contact_settings = contactSettingsCount.count || 0;
    }
  } catch (error: any) {
    connectionStatus = "error";
    connectionError = error.message;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">System Health</h1>
          <p className="text-brand-muted">Supabase connection status and data verification</p>
        </div>
        <form action={refreshHealth}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-border rounded-lg hover:bg-slate-50 transition-colors text-brand-ink"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </form>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            connectionStatus === "connected" 
              ? "bg-green-100" 
              : connectionStatus === "error" 
                ? "bg-red-100" 
                : "bg-yellow-100"
          }`}>
            {connectionStatus === "connected" ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : connectionStatus === "error" ? (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">Supabase Connection</h2>
            <p className={`text-sm ${
              connectionStatus === "connected" 
                ? "text-green-600" 
                : connectionStatus === "error" 
                  ? "text-red-600" 
                  : "text-yellow-600"
            }`}>
              {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Connection Failed" : "Unknown Status"}
            </p>
            {connectionError && (
              <p className="text-sm text-red-600 mt-1">{connectionError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Data Counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-muted">Treatments</p>
              <p className="text-3xl font-bold text-brand-ink mt-1">{counts.treatments}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs mt-3 ${counts.treatments > 0 ? "text-green-600" : "text-red-600"}`}>
            {counts.treatments > 0 ? "Data present" : "No data - run seed SQL"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-muted">Testimonials</p>
              <p className="text-3xl font-bold text-brand-ink mt-1">{counts.testimonials}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs mt-3 ${counts.testimonials > 0 ? "text-green-600" : "text-red-600"}`}>
            {counts.testimonials > 0 ? "Data present" : "No data - run seed SQL"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-muted">FAQs</p>
              <p className="text-3xl font-bold text-brand-ink mt-1">{counts.faqs}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs mt-3 ${counts.faqs > 0 ? "text-green-600" : "text-red-600"}`}>
            {counts.faqs > 0 ? "Data present" : "No data - run seed SQL"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-muted">Website Content</p>
              <p className="text-3xl font-bold text-brand-ink mt-1">{counts.site_content}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs mt-3 ${counts.site_content > 0 ? "text-green-600" : "text-red-600"}`}>
            {counts.site_content > 0 ? "Data present" : "No data - run seed SQL"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-muted">Contact Settings</p>
              <p className="text-3xl font-bold text-brand-ink mt-1">{counts.contact_settings}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
          <p className={`text-xs mt-3 ${counts.contact_settings > 0 ? "text-green-600" : "text-red-600"}`}>
            {counts.contact_settings > 0 ? "Data present" : "No data - run seed SQL"}
          </p>
        </div>
      </div>

      {/* Instructions */}
      {connectionStatus === "connected" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• If counts are 0, run the SEED_DATA.sql in Supabase SQL Editor</li>
            <li>• Verify all tables have expected data before using admin panel</li>
            <li>• Use Refresh button to re-check connection and counts</li>
          </ul>
        </div>
      )}
    </div>
  );
}
