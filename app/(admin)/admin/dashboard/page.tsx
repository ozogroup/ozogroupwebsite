import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  // Fetch dashboard stats (placeholder - will be replaced with real queries)
  const stats = {
    totalTreatments: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalMemberships: 0,
    pendingMemberships: 0,
    activePartners: 0,
    totalPartners: 0,
    pendingPayouts: 0,
    totalCommission: 0,
    paidCommission: 0,
    totalRevenue: 0,
  };

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
            <span className="text-sm text-slate-600 font-medium">Treatments</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalTreatments}</h3>
          <p className="text-sm text-slate-600">Total Treatments</p>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <span className="text-sm text-green-600 font-medium">+{stats.pendingBookings} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalBookings}</h3>
          <p className="text-sm text-slate-600">Total Bookings</p>
        </div>

        {/* Memberships */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-sm text-purple-600 font-medium">+{stats.pendingMemberships} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalMemberships}</h3>
          <p className="text-sm text-slate-600">Total Memberships</p>
        </div>

        {/* Partners */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
            <span className="text-sm text-orange-600 font-medium">{stats.activePartners} active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.totalPartners}</h3>
          <p className="text-sm text-slate-600">Total Partners</p>
        </div>

        {/* Payouts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <span className="text-sm text-red-600 font-medium">{stats.pendingPayouts} pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">₹0</h3>
          <p className="text-sm text-slate-600">Pending Payouts</p>
        </div>

        {/* Total Commission */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-green-600 font-medium">₹{stats.paidCommission} paid</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">₹{stats.totalCommission}</h3>
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
          <h3 className="text-2xl font-bold text-slate-900 mb-1">₹{stats.totalRevenue}</h3>
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
            <div className="flex items-center justify-center py-8 text-slate-500">
              <p className="text-sm">No recent bookings</p>
            </div>
          </div>
        </div>

        {/* Recent Membership Requests */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Membership Requests</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8 text-slate-500">
              <p className="text-sm">No recent membership requests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
