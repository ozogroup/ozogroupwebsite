import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";
import Link from "next/link";
import {
  Sparkles, Star, MessageCircleQuestion, FileText, Phone,
  Calendar, CreditCard, Users, BadgeIndianRupee, Wallet,
  ArrowRight, TrendingUp, Award, IndianRupee, Plus,
} from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard, Badge, EmptyState, Button } from "@/components/admin/ui";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  // Fetch real counts from Supabase (gracefully fall back to 0 if a table is missing)
  const safeCount = async (table: string) => {
    try {
      const r = await (supabase as any).from(table).select("*", { count: "exact", head: true });
      return r.count ?? 0;
    } catch {
      return 0;
    }
  };

  const [
    treatmentsCount,
    testimonialsCount,
    faqsCount,
    siteContentCount,
    contactSettingsCount,
    bookingsCount,
    membershipsCount,
    partnersCount,
    commissionsCount,
    payoutsCount,
  ] = await Promise.all([
    safeCount("treatments"),
    safeCount("testimonials"),
    safeCount("faqs"),
    safeCount("site_content"),
    safeCount("contact_settings"),
    safeCount("bookings"),
    safeCount("memberships"),
    safeCount("partners"),
    safeCount("commissions"),
    safeCount("payouts"),
  ]);

  // Fetch recent data for overview
  const safeQuery = async (q: () => any) => {
    try {
      const r = await q();
      return r?.data ?? [];
    } catch {
      return [];
    }
  };

  const [recentTreatments, recentTestimonials, recentBookings, recentMemberships, recentPartners, pendingPayouts] = await Promise.all([
    safeQuery(() => (supabase as any).from("treatments").select("id,title,price,price_label,type,active").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("testimonials").select("id,name,city,treatment,rating").order("created_at", { ascending: false }).limit(3)),
    safeQuery(() => (supabase as any).from("bookings").select("id,customer_name,customer_phone,city,preferred_date,booking_status").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("memberships").select("id,full_name,mobile,city,membership_status,payment_status,created_at").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("partners").select("id,partner_code,status,profiles(full_name,phone)").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("payouts").select("id,amount,status,created_at,partner:partners(partner_code,profiles(full_name))").eq("status", "pending").order("created_at", { ascending: false }).limit(5)),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening with OZO Service / IA Skin Care today."
        actions={
          <Link href="/admin/treatments" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Treatment
          </Link>
        }
      />

      {/* Content Stats */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">Content Library</h2>
          <Link href="/admin/content" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">
            Manage all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Treatments" value={treatmentsCount} icon={Sparkles} href="/admin/treatments" tone="blue" hint={treatmentsCount > 0 ? "Live on website" : "No data"} />
          <StatCard label="Testimonials" value={testimonialsCount} icon={Star} href="/admin/testimonials" tone="purple" hint={testimonialsCount > 0 ? "Live on website" : "No data"} />
          <StatCard label="FAQs" value={faqsCount} icon={MessageCircleQuestion} href="/admin/faqs" tone="amber" hint={faqsCount > 0 ? "Live on website" : "No data"} />
          <StatCard label="Content Items" value={siteContentCount} icon={FileText} href="/admin/content" tone="teal" hint={siteContentCount > 0 ? "Live on website" : "No data"} />
          <StatCard label="Contact Settings" value={contactSettingsCount} icon={Phone} href="/admin/contact" tone="rose" hint={contactSettingsCount > 0 ? "Configured" : "Not set"} />
        </div>
      </div>

      {/* legacy placeholder to preserve flow - hidden */}
      <div className="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      {/* Business Operations */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.08em]">Business Operations</h2>
          <Link href="/admin/bookings" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">
            View bookings <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Bookings" value={bookingsCount} icon={Calendar} href="/admin/bookings" tone="blue" />
          <StatCard label="Membership Requests" value={membershipsCount} icon={CreditCard} href="/admin/memberships" tone="amber" />
          <StatCard label="Referral Partners" value={partnersCount} icon={Users} href="/admin/partners" tone="green" />
          <StatCard label="Commissions" value={commissionsCount} icon={BadgeIndianRupee} href="/admin/commissions" tone="purple" />
          <StatCard label="Payouts" value={payoutsCount} icon={Wallet} href="/admin/payouts" tone="rose" />
        </div>
      </div>

      {/* Referral Program Summary - premium dark hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-slate-800 text-white">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="relative p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-accent/15 border border-brand-accent/20 rounded-full text-xs font-medium text-brand-accent">
                <TrendingUp className="w-3.5 h-3.5" /> Referral Program
              </div>
              <h2 className="text-2xl font-semibold mt-3 tracking-tight">Partner & Membership Overview</h2>
              <p className="text-sm text-slate-400 mt-1">Multi-level commission structure with milestone bonuses.</p>
            </div>
            <Link href="/admin/partners" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg transition-colors">
              Manage Partners <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-slate-400">
                <IndianRupee className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Membership</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">₹1,199</div>
              <div className="text-xs text-slate-500 mt-1">One-time payment</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-slate-400">
                <BadgeIndianRupee className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Min. earning</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">₹500</div>
              <div className="text-xs text-slate-500 mt-1">Per direct referral</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Partners</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">{partnersCount}</div>
              <div className="text-xs text-slate-500 mt-1">Total enrolled</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-slate-400">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Pending payouts</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">{pendingPayouts.length}</div>
              <div className="text-xs text-slate-500 mt-1">Awaiting approval</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider font-medium">Bonus Milestones</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 10, bonus: "₹5,000" },
                { count: 20, bonus: "₹10,000" },
                { count: 30, bonus: "₹15,000" },
              ].map((m) => (
                <div key={m.count} className="bg-gradient-to-br from-brand-accent/15 to-brand-accent/5 border border-brand-accent/20 rounded-xl p-4">
                  <div className="text-xs text-slate-300">{m.count} referrals</div>
                  <div className="text-xl font-semibold text-brand-accent mt-1 tabular-nums">{m.bonus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="Recent Treatments"
            subtitle="Latest 5 services added"
            action={<Link href="/admin/treatments" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
          />
          <div className="mt-4 -mx-2">
            {recentTreatments.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentTreatments.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">{t.type?.replace("_", " ")} • {t.price_label || `₹${t.price}`}</p>
                    </div>
                    <Badge variant={t.active ? "success" : "neutral"} dot>{t.active ? "Active" : "Inactive"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Sparkles} title="No treatments yet" description="Add your first treatment to get started." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Testimonials"
            subtitle="Latest 3 customer reviews"
            action={<Link href="/admin/testimonials" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
          />
          <div className="mt-4 -mx-2">
            {recentTestimonials.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentTestimonials.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.city} • {t.treatment}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-slate-700 tabular-nums">{t.rating}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Star} title="No testimonials yet" />
            )}
          </div>
        </Card>
      </div>

      {/* Recent Operational Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="Recent Bookings"
            action={<Link href="/admin/bookings" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
          />
          <div className="mt-4 -mx-2">
            {recentBookings.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentBookings.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{b.customer_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{b.city || "—"} • {b.preferred_date || "—"}</p>
                    </div>
                    <Badge variant="info" dot>{b.status || "pending"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Calendar} title="No bookings yet" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Membership Requests"
            action={<Link href="/admin/memberships" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
          />
          <div className="mt-4 -mx-2">
            {recentMemberships.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentMemberships.map((m: any) => {
                  const v = m.membership_status === "active" ? "success" : m.membership_status === "rejected" ? "danger" : "warning";
                  return (
                    <li key={m.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{m.full_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{m.mobile} • {m.city}</p>
                      </div>
                      <Badge variant={v as any} dot>{m.membership_status || "pending"}</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={CreditCard} title="No membership requests" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Referral Partners"
            action={<Link href="/admin/partners" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
          />
          <div className="mt-4 -mx-2">
            {recentPartners.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentPartners.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white">{p.profiles?.full_name?.[0] || "P"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.profiles?.full_name || "—"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{p.partner_code}</p>
                      </div>
                    </div>
                    <Badge variant={p.status === "active" ? "success" : "neutral"} dot>{p.status || "—"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Users} title="No partners yet" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Pending Payouts"
            action={<Link href="/admin/payouts" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
          />
          <div className="mt-4 -mx-2">
            {pendingPayouts.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {pendingPayouts.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.partner?.profiles?.full_name || "—"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">₹{p.amount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Wallet} title="No pending payouts" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
