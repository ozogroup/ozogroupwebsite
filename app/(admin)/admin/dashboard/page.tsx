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
    { data: partnersByMonth },
    { data: recentPayments },
    { data: recentActivities },
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
    supabase.from("partners" as any).select("created_at").gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("payouts" as any).select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("bookings" as any).select("created_at, name, treatment_name, status").order("created_at", { ascending: false }).limit(10),
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

  // Process monthly partner growth data
  const monthlyPartners: { [key: string]: number } = {};
  partnersByMonth?.forEach((partner: any) => {
    const date = new Date(partner.created_at);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyPartners[monthKey] = (monthlyPartners[monthKey] || 0) + 1;
  });

  const partnerData = Object.entries(monthlyPartners).map(([month, count]) => ({ month, count }));
  const maxPartners = Math.max(...partnerData.map(d => d.count), 1);

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
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-5 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">💆</span>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{activeTreatments} active</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{totalTreatments}</h3>
          <p className="text-sm text-slate-500 font-medium">Total Treatments</p>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-5 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">📅</span>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{pendingBookings} pending</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{totalBookings}</h3>
          <p className="text-sm text-slate-500 font-medium">Total Bookings</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-5 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Rate</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{conversionRate}%</h3>
          <p className="text-sm text-slate-500 font-medium">Conversion Rate</p>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-5 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{pendingMemberships} pending</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{totalMemberships}</h3>
          <p className="text-sm text-slate-500 font-medium">Total Memberships</p>
        </div>

        {/* Partners */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-5 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">🤝</span>
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{activePartners} active</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{totalPartners}</h3>
          <p className="text-sm text-slate-500 font-medium">Total Partners</p>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-5 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">💸</span>
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Pending</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{pendingPayouts}</h3>
          <p className="text-sm text-slate-500 font-medium">Payouts</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl shadow-glow p-6 text-white hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 mb-1 font-medium">Total Revenue (6 months)</p>
              <h3 className="text-4xl font-bold">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1 font-medium">Total Commission Paid</p>
              <h3 className="text-4xl font-bold text-slate-900">₹{totalCommission.toLocaleString()}</h3>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
          {monthlyData.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-48">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="w-full bg-gradient-to-t from-brand-primary to-brand-accent rounded-t-lg transition-all hover:opacity-80 animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ height: `${(data.amount / maxRevenue) * 100}%`, animationDelay: `${monthlyData.indexOf(data) * 100}ms` }}
                  />
                  <span className="text-xs text-slate-600 font-medium">{data.month}</span>
                  <span className="text-xs text-slate-500">₹{(data.amount / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-sm">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Referral Growth Chart */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Referral Growth</h2>
          {partnerData.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-48">
              {partnerData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="w-full bg-gradient-to-t from-brand-accent to-brand-light rounded-t-lg transition-all hover:opacity-80 animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ height: `${(data.count / maxPartners) * 100}%`, animationDelay: `${partnerData.indexOf(data) * 100}ms` }}
                  />
                  <span className="text-xs text-slate-600 font-medium">{data.month}</span>
                  <span className="text-xs text-slate-500">{data.count} partners</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <span className="text-4xl mb-2">🤝</span>
              <p className="text-sm">No partner data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Conversion & Top Treatments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Conversion */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Booking Conversion</h2>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - conversionRate / 100)}`}
                  className="animate-in fade-in duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1ba3c6" />
                    <stop offset="100%" stopColor="#5da9d6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{conversionRate}%</span>
                <span className="text-xs text-slate-600">Conversion</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">{confirmedBookings}</p>
              <p className="text-xs text-slate-500">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">{totalBookings}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>

        {/* Treatment Popularity */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Treatment Popularity</h2>
          {treatmentsData && treatmentsData.length > 0 ? (
            <div className="space-y-3">
              {treatmentsData.map((treatment: any, index: number) => {
                const maxReferrals = Math.max(...treatmentsData.map((t: any) => t.total_referrals || 0), 1);
                const percentage = ((treatment.total_referrals || 0) / maxReferrals) * 100;
                return (
                  <div key={treatment.id} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 w-6">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">{treatment.title}</span>
                        <span className="text-xs text-slate-600">{treatment.total_referrals || 0} referrals</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-primary to-brand-accent h-2 rounded-full transition-all hover:shadow-glow"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <span className="text-4xl mb-2">💆</span>
              <p className="text-sm">No treatment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/treatments", icon: "💆", label: "Add Treatment" },
            { href: "/admin/content", icon: "📝", label: "Edit Content" },
            { href: "/admin/bookings", icon: "📅", label: "View Bookings" },
            { href: "/admin/partners", icon: "🤝", label: "View Partners" },
            { href: "/admin/media", icon: "🖼️", label: "Upload Media" },
            { href: "/admin/testimonials", icon: "⭐", label: "Testimonials" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-brand-accent hover:bg-gradient-to-br hover:from-brand-accent/5 hover:to-brand-primary/5 transition-all text-center group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs font-medium text-slate-700 group-hover:text-brand-accent transition-colors">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Activity
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-left duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft">
                    <span className="text-lg">📅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{activity.name}</p>
                    <p className="text-xs text-slate-600">{activity.treatment_name || 'Treatment'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(activity.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${
                    activity.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    activity.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="text-4xl mb-2">📊</span>
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/50 p-6 hover:shadow-lg hover:border-brand-accent/30 transition-all duration-300">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Payments</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((payment: any) => (
                <div key={payment.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">₹{(payment.amount || 0).toLocaleString()}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {payment.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 capitalize font-medium">{payment.method || 'N/A'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="text-4xl mb-2">💳</span>
                <p className="text-sm">No recent payments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
