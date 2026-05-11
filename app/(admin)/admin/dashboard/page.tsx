import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  // Fetch real counts from Supabase
  const [treatmentsResult, testimonialsResult, faqsResult, siteContentResult, contactSettingsResult] = await Promise.all([
    (supabase as any).from("treatments").select("*", { count: "exact", head: true }),
    (supabase as any).from("testimonials").select("*", { count: "exact", head: true }),
    (supabase as any).from("faqs").select("*", { count: "exact", head: true }),
    (supabase as any).from("site_content").select("*", { count: "exact", head: true }),
    (supabase as any).from("contact_settings").select("*", { count: "exact", head: true }),
  ]);

  const treatmentsCount = treatmentsResult.count ?? 0;
  const testimonialsCount = testimonialsResult.count ?? 0;
  const faqsCount = faqsResult.count ?? 0;
  const siteContentCount = siteContentResult.count ?? 0;
  const contactSettingsCount = contactSettingsResult.count ?? 0;

  // Fetch recent data for overview
  const [recentTreatments, recentTestimonials] = await Promise.all([
    (supabase as any).from("treatments").select("id,title,price,price_label,type,active").order("created_at", { ascending: false }).limit(5),
    (supabase as any).from("testimonials").select("id,name,city,treatment,rating").order("created_at", { ascending: false }).limit(3),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Manage OZO Services / IA Skin Care website content, treatments, testimonials and contact settings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Link href="/admin/treatments" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-accent hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${treatmentsCount > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {treatmentsCount > 0 ? "Live" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{treatmentsCount}</h3>
          <p className="text-sm text-slate-600 mt-1">Treatments</p>
        </Link>

        <Link href="/admin/testimonials" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-accent hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${testimonialsCount > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {testimonialsCount > 0 ? "Live" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{testimonialsCount}</h3>
          <p className="text-sm text-slate-600 mt-1">Testimonials</p>
        </Link>

        <Link href="/admin/faqs" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-accent hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${faqsCount > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {faqsCount > 0 ? "Live" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{faqsCount}</h3>
          <p className="text-sm text-slate-600 mt-1">FAQs</p>
        </Link>

        <Link href="/admin/content" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-accent hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${siteContentCount > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {siteContentCount > 0 ? "Live" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{siteContentCount}</h3>
          <p className="text-sm text-slate-600 mt-1">Content Items</p>
        </Link>

        <Link href="/admin/contact" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-accent hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${contactSettingsCount > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {contactSettingsCount > 0 ? "Live" : "Empty"}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{contactSettingsCount}</h3>
          <p className="text-sm text-slate-600 mt-1">Contact Settings</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/admin/treatments" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Manage Treatments</span>
          </Link>
          <Link href="/admin/treatments" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Add Treatment</span>
          </Link>
          <Link href="/admin/testimonials" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Manage Testimonials</span>
          </Link>
          <Link href="/admin/faqs" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Manage FAQs</span>
          </Link>
          <Link href="/admin/content" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Edit Website Content</span>
          </Link>
          <Link href="/admin/contact" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Contact Settings</span>
          </Link>
          <Link href="/admin/system-health" className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">System Health</span>
          </Link>
        </div>
      </div>

      {/* Recent Data Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Treatments */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Treatments</h2>
          <div className="space-y-3">
            {recentTreatments?.data?.length > 0 ? (
              recentTreatments.data.map((treatment: any) => (
                <div key={treatment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{treatment.title}</p>
                    <p className="text-xs text-slate-500">{treatment.type} • {treatment.price_label || treatment.price}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${treatment.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                    {treatment.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No treatments found</p>
            )}
          </div>
        </div>

        {/* Recent Testimonials */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Testimonials</h2>
          <div className="space-y-3">
            {recentTestimonials?.data?.length > 0 ? (
              recentTestimonials.data.map((testimonial: any) => (
                <div key={testimonial.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.city} • {testimonial.treatment}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-slate-600">{testimonial.rating}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No testimonials found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
