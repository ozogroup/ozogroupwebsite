export const dynamic = 'force-dynamic';

export default async function PartnerDirectTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Direct Team</h1>
        <p className="text-slate-600">View your direct referrals</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Partner Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Join Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No direct team members found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
