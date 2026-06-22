import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function PartnerCommissionsPage() {
  await requirePartner();
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>User not found</div>;

  const { data: commissions } = await supabase
    .from("commissions" as any)
    .select("*")
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  const activeCommissions = (commissions || []).filter(
    (c: any) => !c.reversed && c.deleted_at == null && c.status !== "rejected"
  );
  const totalEarned = activeCommissions.filter((c: any) => ["approved", "paid"].includes(c.status)).reduce((s: number, c: any) => s + (c.amount || c.commission_amount || 0), 0);
  const totalPending = activeCommissions.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + (c.amount || c.commission_amount || 0), 0);
  const totalPaid = activeCommissions.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + (c.amount || c.commission_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commission History</h1>
        <p className="text-slate-600">View your commission transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"><p className="text-sm text-slate-600 mb-1">Total Earned</p><p className="text-2xl font-bold text-slate-900">₹{totalEarned.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"><p className="text-sm text-slate-600 mb-1">Pending</p><p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"><p className="text-sm text-slate-600 mb-1">Paid</p><p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {!commissions || commissions.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No commissions found</td></tr>
            ) : commissions.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900">{c.source || "Treatment booking"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">Level {c.level || 1}</td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{(c.amount || c.commission_amount || 0).toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"}`}>{(c.status || "pending").toUpperCase()}</span></td>
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
