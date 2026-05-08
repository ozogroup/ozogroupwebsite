import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";

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
    supabase.from("treatments" as any).select("*", { count: "exact", head: true }).eq("is_active", true),
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Welcome to OZO / IA Skin Care Admin Panel
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Treatments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💆</span>
            </div>
            <span className="text-sm text-slate-600 font-medium">{activeTreatments} active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalTreatments}</h3>
          <p className="text-sm text-slate-600">Total Treatments</p>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <span className="text-sm text-green-600 font-medium">{pendingBookings} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalBookings}</h3>
          <p className="text-sm text-slate-600">Total Bookings</p>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-sm text-purple-600 font-medium">{pendingMemberships} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalMemberships}</h3>
          <p className="text-sm text-slate-600">Total Memberships</p>
        </div>

        {/* Partners */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
            <span className="text-sm text-orange-600 font-medium">{activePartners} active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{totalPartners}</h3>
          <p className="text-sm text-slate-600">Total Partners</p>
        </div>

        {/* Payouts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <span className="text-sm text-red-600 font-medium">{pendingPayouts} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{pendingPayouts}</h3>
          <p className="text-sm text-slate-600">Pending Payouts</p>
        </div>

        {/* Total Commission */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-green-600 font-medium">Paid</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">₹{totalCommission.toLocaleString()}</h3>
          <p className="text-sm text-slate-600">Total Commission</p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <span className="text-sm text-emerald-600 font-medium">This month</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">₹0</h3>
          <p className="text-sm text-slate-600">Total Revenue</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a
            href="/admin/treatments"
            className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center"
          >
            <span className="text-2xl mb-2">💆</span>
            <span className="text-sm font-medium text-slate-700">Add Treatment</span>
          </a>
          <a
            href="/admin/bookings"
            className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center"
          >
            <span className="text-2xl mb-2">📅</span>
            <span className="text-sm font-medium text-slate-700">View Bookings</span>
          </a>
          <a
            href="/admin/memberships"
            className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center"
          >
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium text-slate-700">Approve Membership</span>
          </a>
          <a
            href="/admin/partners"
            className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center"
          >
            <span className="text-2xl mb-2">🤝</span>
            <span className="text-sm font-medium text-slate-700">View Partners</span>
          </a>
          <a
            href="/admin/payouts"
            className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center"
          >
            <span className="text-2xl mb-2">💸</span>
            <span className="text-sm font-medium text-slate-700">Manage Payouts</span>
          </a>
          <a
            href="/admin/content"
            className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center"
          >
            <span className="text-2xl mb-2">📝</span>
            <span className="text-sm font-medium text-slate-700">Edit Content</span>
          </a>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Bookings</h2>
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Membership Requests</h2>
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
