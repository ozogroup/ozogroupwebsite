import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function PartnerTeamPage() {
  await requirePartner();
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>User not found</div>;

  const levels = [1, 2, 3, 4];
  const counts: Record<number, number> = {};
  for (const level of levels) {
    const { count } = await supabase
      .from("referral_tree" as any)
      .select("*", { count: "exact", head: true })
      .eq("ancestor_id", user.id)
      .eq("level", level);
    counts[level] = count || 0;
  }

  const totalTeam = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
        <p className="text-slate-600">View your complete referral tree</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {levels.map((level) => (
          <div key={level} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Level {level}</p>
            <p className="text-3xl font-bold text-slate-900">{counts[level]}</p>
            <p className="text-xs text-slate-500 mt-1">{level === 1 ? "Direct referrals" : level === 2 ? "Second level" : level === 3 ? "Third level" : "Fourth level"}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Referral Tree Summary</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-brand-accent">{totalTeam}</p>
            <p className="text-slate-600 mt-2">Total team members across all levels</p>
          </div>
        </div>
      </div>
    </div>
  );
}
