import { requireAdmin } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function AdminReferralsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral System</h1>
        <p className="text-slate-600">View referral hierarchy and commission levels</p>
      </div>

      {/* Commission Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Level 1</h3>
          <p className="text-3xl font-bold text-brand-accent">6%</p>
          <p className="text-sm text-slate-600 mt-1">Direct referrals</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Level 2</h3>
          <p className="text-3xl font-bold text-brand-accent">3%</p>
          <p className="text-sm text-slate-600 mt-1">Second level</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Level 3</h3>
          <p className="text-3xl font-bold text-brand-accent">1.7%</p>
          <p className="text-sm text-slate-600 mt-1">Third level</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Level 4</h3>
          <p className="text-3xl font-bold text-brand-accent">1.2%</p>
          <p className="text-sm text-slate-600 mt-1">Fourth level</p>
        </div>
      </div>

      {/* Search Partner */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Search Partner</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter partner code or phone"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
          />
          <button className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Referral Tree Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Referral Tree</h2>
        <div className="flex items-center justify-center py-12 text-slate-500">
          <p className="text-sm">Search for a partner to view their referral tree</p>
        </div>
      </div>
    </div>
  );
}
