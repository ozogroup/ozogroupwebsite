import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_DEDUCTION_RATE = 0.15;

function money(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function csvHref(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function monthKey(value?: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const [{ data: bookings }, { data: memberships }, { data: commissions }, { data: payouts }, { data: partners }, { data: settings }] =
    await Promise.all([
      supabase.from("bookings" as any).select("id,booking_id,treatment_order_id,customer_name,customer_phone,treatment_name,treatment_price,payment_amount,booking_status,payment_status,created_at,partner_code,referred_by"),
      supabase.from("memberships" as any).select("id,full_name,mobile,amount,payment_amount,membership_status,payment_status,referral_code,sponsor_id,created_at"),
      supabase.from("commissions" as any).select("id,partner_id,source_type,source_id,source_amount,level,percentage,amount,status,payout_id,created_at,paid_at"),
      supabase.from("payouts" as any).select("id,partner_id,gross_amount,deduction_rate,deduction_amount,net_amount,amount,status,created_at"),
      supabase.from("partners" as any).select("id,partner_code,status,wallet_balance,total_earnings,paid_earnings,sponsor_id,created_at,profiles(full_name)"),
      supabase
        .from("system_settings" as any)
        .select("payout_deduction_rate")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const bookingRows = bookings || [];
  const membershipRows = memberships || [];
  const commissionRows = (commissions || []).filter((row: any) =>
    ["approved", "paid"].includes(String(row.status))
  );
  const payoutRows = payouts || [];
  const partnerRows = partners || [];
  const deductionRate = Number((settings as any)?.payout_deduction_rate ?? DEFAULT_DEDUCTION_RATE);

  const membershipSales = membershipRows.reduce((sum: number, row: any) => sum + Number(row.payment_amount || row.amount || 0), 0);
  const treatmentSales = bookingRows.reduce((sum: number, row: any) => sum + Number(row.payment_amount || row.treatment_price || 0), 0);
  const grossIncome = commissionRows.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const deduction = Math.round(grossIncome * deductionRate * 100) / 100;
  const netIncome = grossIncome - deduction;
  const pendingPayouts = payoutRows.filter((row: any) => ["requested", "processing"].includes(row.status));
  const approvedPayouts = payoutRows.filter((row: any) => row.status === "paid");
  const rejectedPayouts = payoutRows.filter((row: any) => row.status === "rejected");

  const monthlyRevenue = [...bookingRows, ...membershipRows].reduce((acc: Record<string, number>, row: any) => {
    const key = monthKey(row.created_at);
    acc[key] = (acc[key] || 0) + Number(row.payment_amount || row.treatment_price || row.amount || 0);
    return acc;
  }, {});

  const partnerRevenue = partnerRows.map((partner: any) => {
    const partnerCommissions = commissionRows.filter((row: any) => row.partner_id === partner.id);
    const gross = partnerCommissions.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
    const partnerDeduction = Math.round(gross * deductionRate * 100) / 100;
    return {
      partner: partner.profiles?.full_name || partner.partner_code,
      partner_code: partner.partner_code,
      gross,
      deduction: partnerDeduction,
      net: gross - partnerDeduction,
      wallet: Number(partner.wallet_balance || 0),
      paid: Number(partner.paid_earnings || 0),
      status: partner.status,
    };
  });

  const exports = {
    bookings: bookingRows,
    memberships: membershipRows,
    commissions: commissionRows,
    payouts: payoutRows,
    partner_revenue: partnerRevenue,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Reports</h1>
        <p className="text-sm text-brand-muted">Export-ready operational, revenue, income, and payout reporting.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard label="Booking Revenue" value={money(treatmentSales)} />
        <ReportCard label="Membership Sales" value={money(membershipSales)} />
        <ReportCard label="Gross Income" value={money(grossIncome)} />
        <ReportCard label="Net Income" value={money(netIncome)} helper={`15% deduction: ${money(deduction)}`} />
        <ReportCard label="Referral Growth" value={partnerRows.length} helper="Total partner records" />
        <ReportCard label="Pending Payouts" value={pendingPayouts.length} />
        <ReportCard label="Approved Payouts" value={approvedPayouts.length} />
        <ReportCard label="Rejected Payouts" value={rejectedPayouts.length} />
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-brand-ink">CSV Exports</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(exports).map(([name, rows]) => (
            <a
              key={name}
              href={csvHref(`${name}.csv`, rows as Array<Record<string, unknown>>)}
              download={`${name}.csv`}
              className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm font-semibold text-brand-ink hover:border-brand-accent"
            >
              Export {name.replace("_", " ")}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportTable title="Monthly Revenue" rows={Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue: money(revenue) }))} />
        <ReportTable title="Partner Revenue" rows={partnerRevenue.map((row) => ({ ...row, gross: money(row.gross), deduction: money(row.deduction), net: money(row.net), wallet: money(row.wallet), paid: money(row.paid) }))} />
      </div>
    </div>
  );
}

function ReportCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-soft">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-ink">{value}</p>
      {helper && <p className="mt-1 text-xs text-brand-muted">{helper}</p>}
    </div>
  );
}

function ReportTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-soft">
      <div className="border-b border-brand-border bg-brand-surface/50 px-4 py-3">
        <h2 className="font-semibold text-brand-ink">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-muted">{header.replace("_", " ")}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-sm text-brand-muted" colSpan={Math.max(1, headers.length)}>No records</td></tr>
            ) : rows.map((row, index) => (
              <tr key={index}>{headers.map((header) => <td key={header} className="px-4 py-3 text-sm text-brand-ink">{String(row[header] ?? "-")}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
