import Link from "next/link";
import { getSponsoredMembershipRequests } from "@/lib/actions/memberships";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

function toTeamMemberFromMembership(membership: any) {
  return {
    id: membership.partner_id || membership.id,
    name: membership.full_name,
    phone: membership.mobile,
    city: membership.city,
    partnerCode: membership.partners?.partner_code || "KIA ID pending",
    joinDate: membership.partners?.created_at || membership.created_at,
    status: getTeamStatus(membership),
  };
}

export default async function PartnerDirectTeamPage() {
  await requirePartner();
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <div>User not found</div>;

  const { data: tree } = await supabase
    .from("referral_tree" as any)
    .select("descendant_id")
    .eq("ancestor_id", user.id)
    .eq("level", 1);

  const descendantIds = (tree || []).map((t: any) => t.descendant_id);
  let treeMembers: any[] = [];
  if (descendantIds.length > 0) {
    const { data } = await supabase
      .from("partners" as any)
      .select("id, partner_code, status, created_at, profiles:profiles!inner(full_name, phone), city")
      .in("id", descendantIds);
    treeMembers = data || [];
  }

  const sponsoredMemberships = (await getSponsoredMembershipRequests(100)) as any[];
  const sponsoredPartnerIds = new Set(sponsoredMemberships.map((membership) => membership.partner_id).filter(Boolean));
  const allDirectMembers = [
    ...sponsoredMemberships.map(toTeamMemberFromMembership),
    ...treeMembers
      .filter((member) => !sponsoredPartnerIds.has(member.id))
      .map((member) => ({
        id: member.id,
        name: member.profiles?.full_name || "-",
        phone: member.profiles?.phone || "-",
        city: member.city || "-",
        partnerCode: member.partner_code,
        joinDate: member.created_at,
        status: member.status || "active",
      })),
  ];

  const pendingCount = allDirectMembers.filter((member) =>
    ["pending", "pending approval", "pending_payment"].includes(String(member.status).toLowerCase())
  ).length;
  const activeCount = allDirectMembers.filter((member) =>
    ["active", "approved"].includes(String(member.status).toLowerCase())
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Direct Team</h1>
          <p className="text-slate-600">View every direct referral from pending approval through active membership.</p>
        </div>
        <Link href="/partner/new-membership" className="btn-primary justify-center">
          New Membership Registration
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Pending Members" value={pendingCount} tone="warning" />
        <SummaryCard label="Approved / Active Members" value={activeCount} tone="success" />
        <SummaryCard label="Total Direct Team" value={allDirectMembers.length} tone="default" />
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">Membership Registrations</h2>
            <p className="text-sm text-brand-muted">
              Members registered under your ID stay linked here after admin approval.
            </p>
          </div>
          <span className="rounded-full bg-brand-surface px-3 py-1 text-sm font-semibold text-brand-primaryDark">
            {sponsoredMemberships.length}
          </span>
        </div>
        {sponsoredMemberships.length === 0 ? (
          <p className="rounded-lg bg-brand-surface/45 p-4 text-sm text-brand-muted">No membership registrations yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sponsoredMemberships.map((membership) => {
              const status = getTeamStatus(membership);
              return (
                <div key={membership.id} className="rounded-xl border border-brand-border bg-brand-surface/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-ink">{membership.full_name}</p>
                      <p className="mt-1 text-sm text-brand-muted">{membership.city || "-"}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(status)}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-xs font-semibold text-brand-primaryDark">
                    {membership.partners?.partner_code || "KIA ID pending"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Partner Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {allDirectMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No direct team members found
                  </td>
                </tr>
              ) : (
                allDirectMembers.map((member: any) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{member.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.phone || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.city || "-"}</td>
                    <td className="px-6 py-4 font-mono text-sm text-brand-accent">{member.partnerCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass(member.status)}`}>
                        {String(member.status).replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "warning" | "success" | "default" }) {
  const valueClass = tone === "warning" ? "text-amber-700" : tone === "success" ? "text-green-700" : "text-brand-ink";
  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
