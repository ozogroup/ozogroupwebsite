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
    { count: confirmedBookings },
    { count: totalMemberships },
    { count: pendingMemberships },
    { count: totalPartners },
    { count: activePartners },
    { count: pendingPayouts },
    { data: commissionsData },
    { data: recentBookings },
    { data: recentMemberships },
    { data: treatmentsData },
    { data: bookingsByMonth },
  ] = await Promise.all([
    supabase.from("treatments" as any).select("*", { count: "exact", head: true }),
    supabase.from("treatments" as any).select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("bookings" as any).select("*", { count: "exact", head: true }),
    supabase.from("bookings" as any).select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("bookings" as any).select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("membership_requests" as any).select("*", { count: "exact", head: true }),
    supabase.from("membership_requests" as any).select("*", { count: "exact", head: true }).eq("membership_status", "pending"),
    supabase.from("partners" as any).select("*", { count: "exact", head: true }),
    supabase.from("partners" as any).select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payouts" as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("commissions" as any).select("commission_amount").eq("status", "paid"),
    supabase.from("bookings" as any).select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("membership_requests" as any).select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("treatments" as any).select("title, total_referrals").order("total_referrals", { ascending: false }).limit(5),
    supabase.from("bookings" as any).select("created_at, total_amount").gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalCommission = commissionsData?.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0) || 0;
  const totalRevenue = bookingsByMonth?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;
  const conversionRate = (totalBookings || 0) > 0 ? Math.round(((confirmedBookings || 0) / (totalBookings || 1)) * 100) : 0;

  // Process monthly revenue data
  const monthlyRevenue: { [key: string]: number } = {};
  bookingsByMonth?.forEach((booking: any) => {
    const date = new Date(booking.created_at);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (booking.total_amount || 0);
  });

  const monthlyData = Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }));
  const maxRevenue = Math.max(...monthlyData.map(d => d.amount), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Dashboard
          </h1>
          <p className="text-slate-600">
            Overview of your OZO Skin Care business
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Treatments */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💆</span>
            </div>
            <span className="text-xs text-slate-600 font-medium">{activeTreatments} active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalTreatments}</h3>
          <p className="text-xs text-slate-600">Total Treatments</p>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <span className="text-xs text-green-600 font-medium">{pendingBookings} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalBookings}</h3>
          <p className="text-xs text-slate-600">Total Bookings</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-xs text-slate-600 font-medium">Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{conversionRate}%</h3>
          <p className="text-xs text-slate-600">Conversion Rate</p>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
            <span className="text-xs text-indigo-600 font-medium">{pendingMemberships} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalMemberships}</h3>
          <p className="text-xs text-slate-600">Total Memberships</p>
        </div>

        {/* Partners */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🤝</span>
            </div>
            <span className="text-xs text-orange-600 font-medium">{activePartners} active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalPartners}</h3>
          <p className="text-xs text-slate-600">Total Partners</p>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💸</span>
            </div>
            <span className="text-xs text-red-600 font-medium">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{pendingPayouts}</h3>
          <p className="text-xs text-slate-600">Payouts</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 mb-1">Total Revenue (6 months)</p>
              <h3 className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Commission Paid</p>
              <h3 className="text-3xl font-bold text-slate-900">₹{totalCommission.toLocaleString()}</h3>
            </div>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
          {monthlyData.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-48">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-brand-primary to-brand-accent rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(data.amount / maxRevenue) * 100}%` }}
                  />
                  <span className="text-xs text-slate-600 font-medium">{data.month}</span>
                  <span className="text-xs text-slate-500">₹{(data.amount / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              <p className="text-sm">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Treatment Popularity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Treatment Popularity</h2>
          {treatmentsData && treatmentsData.length > 0 ? (
            <div className="space-y-3">
              {treatmentsData.map((treatment: any, index: number) => {
                const maxReferrals = Math.max(...treatmentsData.map((t: any) => t.total_referrals || 0), 1);
                const percentage = ((treatment.total_referrals || 0) / maxReferrals) * 100;
                return (
                  <div key={treatment.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 w-6">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">{treatment.title}</span>
                        <span className="text-xs text-slate-600">{treatment.total_referrals || 0} referrals</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-primary to-brand-accent h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              <p className="text-sm">No treatment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/treatments", icon: "💆", label: "Add Treatment" },
            { href: "/admin/content", icon: "📝", label: "Edit Content" },
            { href: "/admin/bookings", icon: "📅", label: "View Bookings" },
            { href: "/admin/partners", icon: "🤝", label: "View Partners" },
            { href: "/admin/media", icon: "�️", label: "Upload Media" },
            { href: "/admin/testimonials", icon: "⭐", label: "Testimonials" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-slate-50 transition-all text-center group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings && recentBookings.length > 0 ? (
              recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">📅</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{booking.name}</p>
                      <p className="text-xs text-slate-600">{booking.treatment_name || 'Treatment'}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <p className="text-sm">No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Membership Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Membership Requests</h2>
          <div className="space-y-3">
            {recentMemberships && recentMemberships.length > 0 ? (
              recentMemberships.map((membership: any) => (
                <div key={membership.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{membership.full_name}</p>
                      <p className="text-xs text-slate-600">{membership.city}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                    {membership.membership_status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <p className="text-sm">No recent membership requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
