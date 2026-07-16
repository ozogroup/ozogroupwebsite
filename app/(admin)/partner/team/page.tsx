import Link from "next/link";
import { getSponsoredMembershipRequests } from "@/lib/actions/memberships";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

function getTeamStatus(membership: any) {
  if (membership.membership_status === "rejected") return "rejected";
  if (
    membership.partners?.membership_expires_at &&
    new Date(membership.partners.membership_expires_at).getTime() < Date.now()
  ) {
    return "expired";
  }
  if (membership.partners?.status === "active" || membership.membership_status === "active") return "active";
  if (membership.payment_status === "paid") return "approved";
  if (membership.partners?.status) return membership.partners.status;
  return "pending approval";
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (["active", "approved"].includes(normalized)) return "bg-green-100 text-green-700";
  if (normalized === "rejected") return "bg-red-100 text-red-700";
  if (normalized === "expired") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

function firstProfile(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function buildHierarchyRows(treeRows: any[], partners: any[], memberships: any[]) {
  const partnerMap = new Map(partners.map((partner) => [partner.id, partner]));
  const membershipMap = new Map(memberships.map((membership) => [membership.partner_id, membership]));

  return treeRows.map((row) => {
    const partner = partnerMap.get(row.descendant_id) || null;
    const profile = firstProfile(partner?.profiles);
    const membership = membershipMap.get(row.descendant_id) || null;

    return {
      id: row.descendant_id,
      level: row.level,
      created_at: row.created_at,
      name: profile?.full_name || membership?.full_name || "-",
      partnerCode: partner?.partner_code || "KIA ID pending",
      city: partner?.city || membership?.city || "-",
      status: partner?.status || membership?.membership_status || "active",
    };
  });
}

export default async function PartnerTeamPage() {
  const profile = await requirePartner();
  const supabase = getSupabaseServiceClient();
  const partnerId = profile.id;

  const levels = [1, 2, 3, 4];
  const counts: Record<number, number> = {};
  for (const level of levels) {
    const { count } = await supabase
      .from("referral_tree" as any)
      .select("*", { count: "exact", head: true })
      .eq("ancestor_id", partnerId)
      .eq("level", level);
    counts[level] = count || 0;
  }

  const { data: treeRowsRaw } = await supabase
    .from("referral_tree" as any)
    .select("level, descendant_id, created_at")
    .eq("ancestor_id", partnerId)
    .order("level", { ascending: true })
    .order("created_at", { ascending: false });

  const treeRows = treeRowsRaw || [];
  const descendantIds = Array.from(new Set(treeRows.map((row: any) => row.descendant_id).filter(Boolean)));
  const [{ data: treePartners }, { data: treeMemberships }] = descendantIds.length
    ? await Promise.all([
        supabase
          .from("partners" as any)
          .select("id, partner_code, status, created_at, city, profiles(full_name, phone, email)")
          .in("id", descendantIds),
        supabase
          .from("memberships" as any)
          .select("partner_id, full_name, mobile, city, membership_status, payment_status")
          .in("partner_id", descendantIds),
      ])
    : [{ data: [] }, { data: [] }];

  const teamRows = buildHierarchyRows(treeRows, treePartners || [], treeMemberships || []);
  const sponsoredMemberships = (await getSponsoredMembershipRequests(100)) as any[];
  const pendingMemberships = sponsoredMemberships.filter((membership) =>
    ["pending approval", "pending", "pending_payment"].includes(getTeamStatus(membership).toLowerCase())
  );
  const activeSponsoredMemberships = sponsoredMemberships.filter((membership) =>
    ["active", "approved"].includes(getTeamStatus(membership).toLowerCase())
  );
  const totalTeam = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
          <p className="text-slate-600">View your complete referral hierarchy with pending and active direct registrations.</p>
        </div>
        <Link href="/partner/new-membership" className="btn-primary justify-center">
          New Membership Registration
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {levels.map((level) => (
          <div key={level} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm text-slate-600">Level {level}</p>
            <p className="text-3xl font-bold text-slate-900">{counts[level]}</p>
            <p className="mt-1 text-xs text-slate-500">
              {level === 1 ? "Direct active referrals" : level === 2 ? "Second level" : level === 3 ? "Third level" : "Fourth level"}
            </p>
          </div>
        ))}
        <div className="col-span-2 rounded-xl border border-brand-border bg-brand-surface/50 p-6 shadow-sm md:col-span-1">
          <p className="mb-2 text-sm text-brand-muted">Pending Direct</p>
          <p className="text-3xl font-bold text-brand-ink">{pendingMemberships.length}</p>
          <p className="mt-1 text-xs text-brand-muted">Awaiting approval</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Active Hierarchy" value={totalTeam} />
        <SummaryCard label="Pending Direct Members" value={pendingMemberships.length} />
        <SummaryCard label="Approved Direct Members" value={activeSponsoredMemberships.length} />
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">Direct Registration Ledger</h2>
            <p className="text-sm text-brand-muted">Sponsored members remain visible here before and after admin approval.</p>
          </div>
          <span className="rounded-full bg-brand-surface px-3 py-1 text-sm font-semibold text-brand-primaryDark">
            {sponsoredMemberships.length}
          </span>
        </div>
        {sponsoredMemberships.length === 0 ? (
          <p className="rounded-lg bg-brand-surface/45 p-4 text-sm text-brand-muted">No direct registrations yet.</p>
        ) : (
          <div className="divide-y divide-brand-border rounded-lg border border-brand-border">
            {sponsoredMemberships.map((membership) => {
              const status = getTeamStatus(membership);
              return (
                <div key={membership.id} className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium text-brand-ink">{membership.full_name}</p>
                    <p className="text-sm text-brand-muted">
                      {membership.city || "-"} | {membership.partners?.partner_code || "KIA ID pending"}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(status)}`}>
                    {status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Team Hierarchy</h2>
          <p className="text-sm text-slate-600">Approved referral tree by level.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead className="border-b border-slate-200 bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Partner Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {teamRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No approved hierarchy members found yet.
                  </td>
                </tr>
              ) : (
                teamRows.map((row: any) => {
                  return (
                    <tr key={`${row.level}-${row.id}`} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-brand-primaryDark">Level {row.level}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-brand-accent">{row.partnerCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{row.city}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass(row.status || "active")}`}>
                          {String(row.status || "active").replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-ink">{value}</p>
    </div>
  );
}
