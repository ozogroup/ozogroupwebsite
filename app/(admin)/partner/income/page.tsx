import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";
import AutoRefreshRoute from "@/components/AutoRefreshRoute";

export const dynamic = "force-dynamic";

const DEFAULT_DEDUCTION_RATE = 0.15;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currency.format(value || 0);
}

function commissionAmount(commission: any) {
  return Number(commission.amount || 0);
}

export default async function PartnerIncomePage() {
  const profile = await requirePartner();
  const supabase = getSupabaseServiceClient();
  const partnerId = profile.id;

  const [{ data: commissions }, { data: payouts }, { data: partner }, { data: settings }] = await Promise.all([
    supabase
      .from("commissions" as any)
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payouts" as any)
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false }),
    supabase.from("partners" as any).select("wallet_balance, total_earnings, paid_earnings").eq("id", partnerId).single(),
    supabase
      .from("system_settings" as any)
      .select("payout_deduction_rate")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const deductionRate = Number((settings as any)?.payout_deduction_rate ?? DEFAULT_DEDUCTION_RATE);

  const eligibleCommissions = (commissions || []).filter(
    (commission: any) =>
      commission.deleted_at == null && !commission.reversed && commission.status !== "rejected"
  );
  const recordedCommissions = eligibleCommissions.filter((commission: any) =>
    ["pending", "approved", "paid"].includes(String(commission.status))
  );
  const membershipIncome = recordedCommissions
    .filter((commission: any) => commission.source_type === "membership")
    .reduce((sum: number, commission: any) => sum + commissionAmount(commission), 0);
  const productIncome = recordedCommissions
    .filter((commission: any) => commission.source_type === "booking")
    .reduce((sum: number, commission: any) => sum + commissionAmount(commission), 0);
  const bonusIncome = 0;
  const grossIncome = membershipIncome + productIncome + bonusIncome;
  const deduction = Math.round(grossIncome * deductionRate * 100) / 100;
  const totalIncome = grossIncome - deduction;
  const pendingIncome = eligibleCommissions
    .filter((commission: any) => commission.status === "pending")
    .reduce((sum: number, commission: any) => sum + commissionAmount(commission), 0);
  const paidIncome = eligibleCommissions
    .filter((commission: any) => commission.status === "paid")
    .reduce((sum: number, commission: any) => sum + commissionAmount(commission), 0);
  const approvedIncome = eligibleCommissions
    .filter((commission: any) => commission.status === "approved")
    .reduce((sum: number, commission: any) => sum + commissionAmount(commission), 0);
  const pendingPayout = (payouts || [])
    .filter((payout: any) => ["pending", "requested", "processing"].includes(payout.status))
    .reduce((sum: number, payout: any) => sum + Number(payout.amount || 0), 0);
  const walletBalance = Number((partner as any)?.wallet_balance || 0);

  const incomeCards = [
    { label: "My Income", value: grossIncome, helper: "Gross recorded income", dark: true },
    { label: "Membership Income", value: membershipIncome, helper: "Membership commissions", dark: false },
    { label: "Product Income", value: productIncome, helper: "Kit and treatment bookings", dark: false },
    { label: "Bonus Income", value: bonusIncome, helper: "Recorded bonus rewards", dark: false },
    { label: "Total Income", value: totalIncome, helper: "After 15% deduction", dark: true },
  ];

  return (
    <div className="space-y-6">
      <AutoRefreshRoute />
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">My Income</h1>
        <p className="text-brand-muted">View your recorded earnings and final income calculation.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {incomeCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl p-5 shadow-card ${
              card.dark
                ? "bg-gradient-to-br from-brand-ink to-brand-muted text-white"
                : "border border-brand-border bg-white text-brand-ink"
            }`}
          >
            <p className={`mb-2 text-sm font-medium ${card.dark ? "text-white/90" : "text-brand-muted"}`}>{card.label}</p>
            <p className={`text-2xl font-bold ${card.dark ? "text-white" : "text-brand-ink"}`}>{formatCurrency(card.value)}</p>
            <p className={`mt-2 text-xs ${card.dark ? "text-white/80" : "text-brand-muted"}`}>{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-brand-ink">Income Calculation</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <IncomeMetric label="Gross Income" value={formatCurrency(grossIncome)} />
          <IncomeMetric label="15% Deduction" value={`- ${formatCurrency(deduction)}`} />
          <div className="rounded-lg bg-brand-ink p-4 text-white">
            <p className="text-sm text-white/85">Final Total Income</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-brand-muted">
          Total Income = Membership Income + Product Income + Bonus Income - 15% deduction.
        </p>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-brand-ink">Wallet Balance</h2>
        <div className="flex flex-col gap-4 rounded-lg bg-brand-accent/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm text-brand-muted">Available Balance</p>
            <p className="text-3xl font-bold text-brand-accent">{formatCurrency(walletBalance)}</p>
            <p className="mt-2 text-xs text-brand-muted">
              Pending income: {formatCurrency(pendingIncome)} | Approved income: {formatCurrency(approvedIncome)} | Paid income: {formatCurrency(paidIncome)} | Pending payout: {formatCurrency(pendingPayout)}
            </p>
          </div>
          <a
            href="/partner/payouts"
            className="rounded-lg bg-brand-accent px-6 py-3 text-center font-medium text-white transition-colors hover:bg-brand-accent/90"
          >
            Request Payout
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-brand-ink">Commission History</h2>
        {commissions && commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Level</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((commission: any) => (
                  <tr key={commission.id} className="border-b border-brand-border/60 hover:bg-brand-surface/35">
                    <td className="px-4 py-3 text-sm text-brand-muted">
                      {new Date(commission.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-ink">
                      {commission.source_type === "membership"
                        ? "Membership"
                        : "Product / Treatment Booking"}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">Level {commission.level || 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-primaryDark">{formatCurrency(commissionAmount(commission))}</td>
                    <td className="px-4 py-3">
                      <IncomeStatus status={commission.status || "pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-12 text-center text-brand-muted">No commissions yet. Register members and share eligible bookings to grow income.</p>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-brand-ink">Payout History</h2>
        {payouts && payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout: any) => (
                  <tr key={payout.id} className="border-b border-brand-border/60 hover:bg-brand-surface/35">
                    <td className="px-4 py-3 text-sm text-brand-muted">
                      {new Date(payout.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-ink">{formatCurrency(Number(payout.amount || 0))}</td>
                    <td className="px-4 py-3 text-sm text-brand-muted">{payout.payment_method || payout.method || "Bank Transfer"}</td>
                    <td className="px-4 py-3"><IncomeStatus status={payout.status || "pending"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-12 text-center text-brand-muted">No payout requests found.</p>
        )}
      </div>
    </div>
  );
}

function IncomeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-surface/50 p-4">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function IncomeStatus({ status }: { status: string }) {
  const color =
    status === "paid"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-brand-light text-brand-primaryDark";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${color}`}>
      {status}
    </span>
  );
}
