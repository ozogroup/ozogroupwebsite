import Link from "next/link";
import { getSponsoredMembershipRequests } from "@/lib/actions/memberships";
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
  const pendingMemberships = ((await getSponsoredMembershipRequests(100)) as any[]).filter(
    (membership) => !["active", "rejected"].includes(membership.membership_status)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
          <p className="text-slate-600">View your approved referral tree and pending direct registrations</p>
        </div>
        <Link href="/partner/new-membership" className="btn-primary justify-center">
          New Membership Registration
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {levels.map((level) => (
          <div key={level} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Level {level}</p>
            <p className="text-3xl font-bold text-slate-900">{counts[level]}</p>
            <p className="text-xs text-slate-500 mt-1">{level === 1 ? "Direct referrals" : level === 2 ? "Second level" : level === 3 ? "Third level" : "Fourth level"}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-brand-border bg-brand-surface/50 p-6 shadow-sm md:col-span-1">
          <p className="mb-2 text-sm text-brand-muted">Pending Direct</p>
          <p className="text-3xl font-bold text-brand-ink">{pendingMemberships.length}</p>
          <p className="mt-1 text-xs text-brand-muted">Awaiting approval</p>
        </div>
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

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">Pending Direct Registrations</h2>
            <p className="text-sm text-brand-muted">New members linked to you before admin approval.</p>
          </div>
          <span className="rounded-full bg-brand-surface px-3 py-1 text-sm font-semibold text-brand-primaryDark">
            {pendingMemberships.length}
          </span>
        </div>
        {pendingMemberships.length === 0 ? (
          <p className="rounded-lg bg-brand-surface/45 p-4 text-sm text-brand-muted">No pending direct registrations.</p>
        ) : (
          <div className="divide-y divide-brand-border rounded-lg border border-brand-border">
            {pendingMemberships.slice(0, 10).map((membership) => (
              <div key={membership.id} className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-brand-ink">{membership.full_name}</p>
                  <p className="text-sm text-brand-muted">{membership.city || "-"} | {membership.partners?.partner_code || "KIA ID pending"}</p>
                </div>
                <span className="w-fit rounded-full bg-brand-light px-3 py-1 text-xs font-semibold capitalize text-brand-primaryDark">
                  {(membership.payment_status || "pending").replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
