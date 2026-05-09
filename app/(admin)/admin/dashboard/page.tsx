import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";
import SyncButton from "@/components/admin/SyncButton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  // Fetch real dashboard stats from Supabase
  const [
    { count: totalTreatments },
    { count: activeTreatments },
    { count: totalBookings },
    { count: pendingBookings },
    { count: totalMemberships },
    { count: pendingMemberships },
    { count: totalPartners },
    { count: activePartners },
    { count: pendingPayouts },
    { data: commissionsData },
    { data: recentBookings },
    { data: recentMemberships },
  ] = await Promise.all([
    supabase.from("treatments" as any).select("*", { count: "exact", head: true }),
    supabase.from("treatments" as any).select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("bookings" as any).select("*", { count: "exact", head: true }),
    supabase.from("bookings" as any).select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("membership_requests" as any).select("*", { count: "exact", head: true }),
    supabase.from("membership_requests" as any).select("*", { count: "exact", head: true }).eq("membership_status", "pending"),
    supabase.from("partners" as any).select("*", { count: "exact", head: true }),
    supabase.from("partners" as any).select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payouts" as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("commissions" as any).select("commission_amount").eq("status", "paid"),
    supabase.from("bookings" as any).select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("membership_requests" as any).select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalCommission = commissionsData?.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0) || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-ink mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-brand-muted">
            Manage OZO / IA Skin Care website content, bookings & partners
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Treatments */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💆</span>
            </div>
            <span className="text-sm text-slate-600 font-medium">{activeTreatments} active</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">{totalTreatments}</h3>
          <p className="text-sm text-brand-muted">Total Treatments</p>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <span className="text-sm text-green-600 font-medium">{pendingBookings} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">{totalBookings}</h3>
          <p className="text-sm text-brand-muted">Total Bookings</p>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-sm text-purple-600 font-medium">{pendingMemberships} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">{totalMemberships}</h3>
          <p className="text-sm text-brand-muted">Total Memberships</p>
        </div>

        {/* Partners */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
            <span className="text-sm text-orange-600 font-medium">{activePartners} active</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">{totalPartners}</h3>
          <p className="text-sm text-brand-muted">Total Partners</p>
        </div>

        {/* Payouts */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <span className="text-sm text-red-600 font-medium">{pendingPayouts} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">{pendingPayouts}</h3>
          <p className="text-sm text-brand-muted">Pending Payouts</p>
        </div>

        {/* Total Commission */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-green-600 font-medium">Paid</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">₹{totalCommission.toLocaleString()}</h3>
          <p className="text-sm text-brand-muted">Total Commission</p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <span className="text-sm text-emerald-600 font-medium">This month</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-ink mb-1">₹0</h3>
          <p className="text-sm text-brand-muted">Total Revenue</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
        <h2 className="text-lg font-semibold text-brand-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/treatments", icon: "💆", label: "Add Treatment" },
            { href: "/admin/content", icon: "📝", label: "Edit Home Content" },
            { href: "/admin/bookings", icon: "📅", label: "View Bookings" },
            { href: "/admin/partners", icon: "🤝", label: "View Partners" },
            { href: "/admin/contact", icon: "�", label: "Update Contact Info" },
            { href: "/admin/media", icon: "🖼️", label: "Upload Media" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-surface transition-all text-center group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs font-medium text-brand-ink">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <h2 className="text-lg font-semibold text-brand-ink mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {recentBookings && recentBookings.length > 0 ? (
              recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{booking.name}</p>
                    <p className="text-xs text-slate-600">{booking.treatment_name || 'Treatment'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <p className="text-sm">No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Membership Requests */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <h2 className="text-lg font-semibold text-brand-ink mb-4">Recent Membership Requests</h2>
          <div className="space-y-4">
            {recentMemberships && recentMemberships.length > 0 ? (
              recentMemberships.map((membership: any) => (
                <div key={membership.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{membership.full_name}</p>
                    <p className="text-xs text-slate-600">{membership.city}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    {membership.membership_status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <p className="text-sm">No recent membership requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
