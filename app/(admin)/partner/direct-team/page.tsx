import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function PartnerDirectTeamPage() {
  await requirePartner();
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>User not found</div>;

  const { data: tree } = await supabase
    .from("referral_tree" as any)
    .select("descendant_id")
    .eq("ancestor_id", user.id)
    .eq("level", 1);

  const descendantIds = (tree || []).map((t: any) => t.descendant_id);
  let members: any[] = [];
  if (descendantIds.length > 0) {
    const { data } = await supabase
      .from("partners" as any)
      .select("id, partner_code, status, created_at, profiles:profiles!inner(full_name, phone), city")
      .in("id", descendantIds);
    members = data || [];
  }

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
            {members.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No direct team members found</td></tr>
            ) : members.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{m.profiles?.full_name || "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{m.profiles?.phone || "—"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{m.city || "—"}</td>
                <td className="px-6 py-4 text-sm font-mono text-brand-accent">{m.partner_code}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === "active" || m.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
