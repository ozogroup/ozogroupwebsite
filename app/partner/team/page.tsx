export const dynamic = 'force-dynamic';

export default async function PartnerTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
        <p className="text-slate-600">View your complete referral tree</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Level 1</p>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">Direct referrals</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Level 2</p>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">Second level</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Level 3</p>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">Third level</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Level 4</p>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">Fourth level</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Referral Tree</h2>
        <div className="flex items-center justify-center py-12 text-slate-500">
          <p className="text-sm">No team members yet. Start sharing your referral link!</p>
        </div>
      </div>
    </div>
  );
}
