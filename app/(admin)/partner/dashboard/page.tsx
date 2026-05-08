import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function PartnerDashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const partnerCode = (profile as any)?.partner_code || "N/A";
  const membershipStatus = (profile as any)?.membership_status || "pending";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Partner Dashboard</h1>
        <p className="text-slate-600">Welcome back!</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-brand-accent to-brand-light rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Your Referral Link</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            readOnly
            value={`https://ozo.group/join?ref=${partnerCode}`}
            className="flex-1 px-4 py-2 bg-white/20 rounded-lg text-white placeholder-white/70 outline-none"
          />
          <button className="px-4 py-2 bg-white text-brand-accent rounded-lg font-medium hover:bg-white/90 transition-colors">
            Copy
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
            WhatsApp
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Direct Team</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Level 2 Team</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Level 3 Team</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Level 4 Team</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">₹0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Pending Earnings</p>
          <p className="text-2xl font-bold text-orange-600">₹0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Paid Earnings</p>
          <p className="text-2xl font-bold text-slate-900">₹0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold text-brand-accent">₹0</p>
        </div>
      </div>

      {/* Membership Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Membership Status</h2>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            membershipStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {membershipStatus.toUpperCase()}
          </span>
          <span className="text-sm text-slate-600">Partner Code: {partnerCode}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/partner/referral-link" className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center">
            <span className="text-2xl mb-2">🔗</span>
            <span className="text-sm font-medium text-slate-700">Share Link</span>
          </a>
          <a href="/partner/direct-team" className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center">
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium text-slate-700">Direct Team</span>
          </a>
          <a href="/partner/income" className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center">
            <span className="text-2xl mb-2">💰</span>
            <span className="text-sm font-medium text-slate-700">My Income</span>
          </a>
          <a href="/partner/payouts" className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-center">
            <span className="text-2xl mb-2">💸</span>
            <span className="text-sm font-medium text-slate-700">Request Payout</span>
          </a>
        </div>
      </div>
    </div>
  );
}
