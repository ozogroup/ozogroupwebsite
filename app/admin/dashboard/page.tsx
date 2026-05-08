import { requireAdmin } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Protect this page - only accessible by authenticated admins
  await requireAdmin();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome, Admin
        </h1>
        <p className="text-slate-600">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-sm text-green-600 font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">0</h3>
          <p className="text-sm text-slate-600">Total Partners</p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-light/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-green-600 font-medium">+8%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">₹0</h3>
          <p className="text-sm text-slate-600">Total Earnings</p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <span className="text-sm text-slate-600 font-medium">0%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">0</h3>
          <p className="text-sm text-slate-600">Bookings Today</p>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <span className="text-sm text-slate-600 font-medium">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">0</h3>
          <p className="text-sm text-slate-600">Membership Requests</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder 1 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Revenue Overview
          </h2>
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
            <p className="text-slate-500">Chart placeholder</p>
          </div>
        </div>

        {/* Chart Placeholder 2 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Partner Growth
          </h2>
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
            <p className="text-slate-500">Chart placeholder</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📝</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-900 font-medium">
                No recent activity
              </p>
              <p className="text-xs text-slate-500">
                Activity will appear here once the system is in use
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
