import { requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function amount(row: any) {
  return Number(row.amount || 0);
}

function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default async function PartnerCommissionsPage() {
  const profile = await requirePartner();
  const supabase = getSupabaseServiceClient();
  const partnerId = profile.id;

  const { data: commissions } = await supabase
    .from("commissions" as any)
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  const bookingIds = (commissions || [])
    .filter((commission: any) => commission.source_type === "booking" && commission.source_id)
    .map((commission: any) => commission.source_id);
  const membershipIds = (commissions || [])
    .filter((commission: any) => commission.source_type === "membership" && commission.source_id)
    .map((commission: any) => commission.source_id);

  const [{ data: bookings }, { data: memberships }] = await Promise.all([
    bookingIds.length
      ? supabase
          .from("bookings" as any)
          .select("id, booking_id, treatment_order_id, customer_name, treatment_name, payment_amount, treatment_price")
          .in("id", Array.from(new Set(bookingIds)))
      : { data: [] },
    membershipIds.length
      ? supabase
          .from("memberships" as any)
          .select("id, membership_id, full_name, city, payment_amount, amount")
          .in("id", Array.from(new Set(membershipIds)))
      : { data: [] },
  ]);
  const bookingById = new Map((bookings || []).map((booking: any) => [booking.id, booking]));
  const membershipById = new Map((memberships || []).map((membership: any) => [membership.id, membership]));

  const activeCommissions = (commissions || []).filter(
    (commission: any) => !commission.reversed && commission.deleted_at == null && commission.status !== "rejected"
  );
  const totalEarned = activeCommissions
    .filter((commission: any) => ["approved", "paid"].includes(commission.status))
    .reduce((sum: number, commission: any) => sum + amount(commission), 0);
  const totalPending = activeCommissions
    .filter((commission: any) => commission.status === "pending")
    .reduce((sum: number, commission: any) => sum + amount(commission), 0);
  const totalPaid = activeCommissions
    .filter((commission: any) => commission.status === "paid")
    .reduce((sum: number, commission: any) => sum + amount(commission), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commission History</h1>
        <p className="text-slate-600">View your commission transactions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total Earned" value={money(totalEarned)} tone="default" />
        <SummaryCard label="Pending" value={money(totalPending)} tone="warning" />
        <SummaryCard label="Paid" value={money(totalPaid)} tone="success" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {!commissions || commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No commissions found
                  </td>
                </tr>
              ) : (
                commissions.map((commission: any) => (
                  <tr key={commission.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {commission.source_type === "membership" ? (
                        <div>
                          <p className="font-medium">Referral Bonus Rs. 500</p>
                          <p className="text-xs text-slate-500">
                            {(membershipById.get(commission.source_id) as any)?.full_name || "New member"} | {(membershipById.get(commission.source_id) as any)?.membership_id || commission.source_id}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">Treatment Booking</p>
                          <p className="text-xs text-slate-500">
                            {(bookingById.get(commission.source_id) as any)?.customer_name || "Customer"} | {(bookingById.get(commission.source_id) as any)?.treatment_name || "Treatment"}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Level {commission.level || 1}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {commission.source_type === "membership" ? "Flat" : `${Number(commission.percentage || 0)}%`}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{money(amount(commission))}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(commission.status)}`}>
                        {(commission.status || "pending").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {commission.created_at ? new Date(commission.created_at).toLocaleDateString("en-IN") : "-"}
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

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "default" | "warning" | "success" }) {
  const toneClass = tone === "warning" ? "text-amber-600" : tone === "success" ? "text-green-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-1 text-sm text-slate-600">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}
