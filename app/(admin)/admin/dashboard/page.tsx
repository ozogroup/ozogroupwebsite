import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/helpers";
import Link from "next/link";
import {
  Sparkles, Star, MessageCircleQuestion, FileText, Phone,
  Calendar, CreditCard, Users, BadgeIndianRupee, Wallet,
  ArrowRight, TrendingUp, Award, IndianRupee, Plus, ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, StatCard, Badge, EmptyState } from "@/components/admin/ui";
import AutoRefreshRoute from "@/components/AutoRefreshRoute";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import AdminDashboardCharts from "@/components/admin/AdminDashboardCharts";
import { resolveDateRange } from "@/lib/date-range";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const resolvedSearchParams = await searchParams;

  // Fetch real counts from Supabase (gracefully fall back to 0 if a table is missing)
  const safeCount = async (table: string) => {
    try {
      const r = await (supabase as any).from(table).select("*", { count: "exact", head: true });
      return r.count ?? 0;
    } catch {
      return 0;
    }
  };

  const [
    treatmentsCount,
    testimonialsCount,
    faqsCount,
    siteContentCount,
    contactSettingsCount,
    bookingsCount,
    membershipsCount,
    partnersCount,
    commissionsCount,
    payoutsCount,
  ] = await Promise.all([
    safeCount("treatments"),
    safeCount("testimonials"),
    safeCount("faqs"),
    safeCount("site_content"),
    safeCount("contact_settings"),
    safeCount("bookings"),
    safeCount("memberships"),
    safeCount("partners"),
    safeCount("commissions"),
    safeCount("payouts"),
  ]);

  // Fetch recent data for overview
  const safeQuery = async (q: () => any) => {
    try {
      const r = await q();
      return r?.data ?? [];
    } catch {
      return [];
    }
  };

  const [recentTreatments, recentTestimonials, recentBookings, recentMemberships, recentPartners, pendingPayouts] = await Promise.all([
    safeQuery(() => (supabase as any).from("treatments").select("id,title,price,price_label,type,active").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("testimonials").select("id,name,city,treatment,rating").order("created_at", { ascending: false }).limit(3)),
    safeQuery(() => (supabase as any).from("bookings").select("id,customer_name,customer_phone,city,booking_status,created_at").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("memberships").select("id,full_name,mobile,city,membership_status,payment_status,created_at").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("partners").select("id,partner_code,status,profiles(full_name,phone)").order("created_at", { ascending: false }).limit(5)),
    safeQuery(() => (supabase as any).from("payouts").select("id,amount,status,created_at,partner:partners(partner_code,profiles(full_name))").in("status", ["requested", "processing"]).order("created_at", { ascending: false }).limit(5)),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [activePartnersCount, expiredMembershipsCount, todayBookingsCount, pendingKycCount, pendingPayoutsCount, monthlyBookings, allPayouts, allSales, verifiedKycCount, rejectedKycCount] = await Promise.all([
    safeCount("partners").then(async () => {
      const r = await (supabase as any).from("partners").select("*", { count: "exact", head: true }).eq("status", "active");
      return r.count ?? 0;
    }),
    (async () => {
      const r = await (supabase as any).from("partners").select("*", { count: "exact", head: true }).lt("membership_expires_at", new Date().toISOString());
      return r.count ?? 0;
    })(),
    (async () => {
      const r = await (supabase as any).from("bookings").select("*", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`);
      return r.count ?? 0;
    })(),
    (async () => {
      const r = await (supabase as any).from("partners").select("*", { count: "exact", head: true }).eq("kyc_status", "pending");
      return r.count ?? 0;
    })(),
    (async () => {
      const r = await (supabase as any).from("payouts").select("*", { count: "exact", head: true }).in("status", ["requested", "processing"]);
      return r.count ?? 0;
    })(),
    safeQuery(() => (supabase as any).from("bookings").select("payment_amount,treatment_name,treatment_price,created_at").gte("created_at", monthStart.toISOString())),
    safeQuery(() => (supabase as any).from("payouts").select("amount,status")),
    safeQuery(() => (supabase as any).from("bookings").select("treatment_name,treatment_price,payment_amount,booking_status,payment_status,referred_by,partner_code")),
    (async () => {
      const r = await (supabase as any).from("partners").select("*", { count: "exact", head: true }).in("kyc_status", ["verified", "approved"]);
      return r.count ?? 0;
    })(),
    (async () => {
      const r = await (supabase as any).from("partners").select("*", { count: "exact", head: true }).eq("kyc_status", "rejected");
      return r.count ?? 0;
    })(),
  ]);

  const monthlyRevenue = monthlyBookings.reduce((sum: number, b: any) => sum + Number(b.payment_amount || b.treatment_price || 0), 0);
  const totalPayoutAmount = allPayouts.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const confirmedSalesRows = allSales.filter((s: any) => ["confirmed", "completed"].includes(String(s.booking_status)));
  const treatmentRanking = confirmedSalesRows.reduce((acc: Record<string, number>, s: any) => {
    const name = s.treatment_name || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const topSellingTreatment = Object.entries(treatmentRanking).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "No sales yet";
  const partnerRanking = confirmedSalesRows.reduce((acc: Record<string, { name: string; count: number }>, s: any) => {
    const id = s.referred_by || s.partner_code || "direct";
    acc[id] = acc[id] || { name: id === "direct" ? "Direct sales" : String(id), count: 0 };
    acc[id].count += 1;
    return acc;
  }, {});
  const topPerformingPartner =
    (Object.values(partnerRanking) as Array<{ name: string; count: number }>).sort((a, b) => b.count - a.count)[0]?.name ||
    "No sales yet";

  const range = resolveDateRange(resolvedSearchParams);
  const [{ data: periodBookings }, { data: periodCommissions }, { data: periodPayoutRows }, { data: walletPartners }, { data: periodSales }] =
    await Promise.all([
      (supabase as any).from("bookings").select("payment_amount,treatment_price,payment_status,created_at"),
      (supabase as any).from("commissions").select("amount,level,status,source_type,created_at,reversed,deleted_at"),
      (supabase as any).from("payouts").select("amount,status,created_at"),
      (supabase as any).from("partners").select("id,partner_code,wallet_balance,profiles(full_name)"),
      (supabase as any).from("bookings").select("referred_by,partner_code,treatment_price,payment_amount,booking_status,created_at"),
    ]);
  const [{ data: periodMembershipRows }, { data: periodFranchiseRows }, { data: periodPartnerRows }] = await Promise.all([
    (supabase as any).from("memberships").select("amount,payment_amount,payment_status,membership_status,created_at"),
    (supabase as any).from("franchise_leads").select("status,investment_budget,created_at"),
    (supabase as any).from("partners").select("id,status,kyc_status,created_at"),
  ]);
  const filteredBookings = (periodBookings || []).filter((row: any) => range.includes(row.created_at));
  const activeCommissions = (periodCommissions || []).filter((row: any) => !row.reversed && !row.deleted_at);
  const filteredCommissions = activeCommissions.filter((row: any) => range.includes(row.created_at) && ["approved", "paid"].includes(String(row.status)));
  const filteredPayouts = (periodPayoutRows || []).filter((row: any) => range.includes(row.created_at));
  const filteredSales = (periodSales || []).filter((row: any) => range.includes(row.created_at) && ["confirmed", "completed"].includes(row.booking_status));
  const filteredMemberships = (periodMembershipRows || []).filter((row: any) => range.includes(row.created_at));
  const filteredFranchise = (periodFranchiseRows || []).filter((row: any) => range.includes(row.created_at));
  const filteredPartners = (periodPartnerRows || []).filter((row: any) => range.includes(row.created_at));
  const parseMoney = (input: unknown) => Number(String(input || "0").replace(/[^0-9.]/g, "")) || 0;
  const payoutDeductionRate = 0.15;
  const paidBookingRows = filteredBookings.filter((row: any) => row.payment_status === "paid");
  const paidBookingSales = filteredBookings
    .filter((row: any) => row.payment_status === "paid")
    .reduce((sum: number, row: any) => sum + Number(row.payment_amount || row.treatment_price || 0), 0);
  const paidMembershipRows = filteredMemberships.filter((row: any) => row.payment_status === "paid");
  const activeMembershipRows = filteredMemberships.filter((row: any) => ["active", "approved"].includes(String(row.membership_status || "")));
  const membershipRevenue = paidMembershipRows.reduce((sum: number, row: any) => sum + Number(row.payment_amount || row.amount || 0), 0);
  const approvedFranchiseRows = filteredFranchise.filter((row: any) => ["approved", "converted", "closed"].includes(String(row.status || "")));
  const franchiseBusiness = approvedFranchiseRows.reduce((sum: number, row: any) => sum + parseMoney(row.investment_budget), 0);
  const totalWalletBalance = (walletPartners || []).reduce((sum: number, row: any) => sum + Number(row.wallet_balance || 0), 0);
  const periodPendingPayouts = filteredPayouts.filter((row: any) => ["requested", "processing"].includes(row.status));
  const periodPaidPayouts = filteredPayouts.filter((row: any) => row.status === "paid");
  const periodGrossPayout = activeCommissions
    .filter((row: any) => range.includes(row.created_at) && ["pending", "approved"].includes(String(row.status)))
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const periodDeduction = Math.round(periodGrossPayout * payoutDeductionRate * 100) / 100;
  const periodNetPayable = Math.round((periodGrossPayout - periodDeduction) * 100) / 100;
  const paidDistributedPayout = periodPaidPayouts.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const newPartners = filteredPartners.length;
  const activePartnersInPeriod = (periodPartnerRows || []).filter((row: any) => row.status === "active").length;
  const pendingKycInPeriod = (periodPartnerRows || []).filter((row: any) => row.kyc_status === "pending").length;
  const approvedKycInPeriod = (periodPartnerRows || []).filter((row: any) => ["verified", "approved"].includes(String(row.kyc_status || ""))).length;
  const partnerSales = filteredSales.reduce((acc: Record<string, number>, row: any) => {
    const partnerKey = row.referred_by || row.partner_code || "direct";
    acc[partnerKey] = (acc[partnerKey] || 0) + Number(row.payment_amount || row.treatment_price || 0);
    return acc;
  }, {});
  const partnerLookup = new Map<string, string>(
    (walletPartners || []).map((row: any) => {
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return [String(row.id), String(prof?.full_name || row.partner_code)];
    })
  );
  const topPeriodPartners: Array<{ name: string; amount: number }> = Object.entries(partnerSales)
    .map(([id, amount]) => ({
      name: id === "direct" ? "Direct sales" : partnerLookup.get(id) || id,
      amount: Number(amount),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Commission still owed to partners (pending + approved, not yet paid out).
  const commissionLiability = activeCommissions
    .filter((row: any) => ["pending", "approved"].includes(String(row.status)))
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const referralBonusLiability = activeCommissions
    .filter((row: any) => row.source_type === "membership" && ["pending", "approved"].includes(String(row.status)))
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const actionItemsCount = pendingKycCount + pendingPayoutsCount;
  const netPayoutDue = Math.round(totalWalletBalance * 0.85 * 100) / 100;
  const paidThisMonth = (periodPayoutRows || [])
    .filter((row: any) => row.status === "paid" && new Date(row.created_at) >= monthStart)
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  // Last 6 calendar months, independent of the date-range filter above.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [{ data: trendBookings }, { data: trendPartnersRaw }] = await Promise.all([
    (supabase as any).from("bookings").select("payment_amount,treatment_price,payment_status,created_at").gte("created_at", sixMonthsAgo.toISOString()),
    (supabase as any).from("partners").select("created_at").gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push(d.toLocaleDateString("en-IN", { month: "short" }));
  }
  const salesByMonth: Record<string, number> = Object.fromEntries(monthLabels.map((m) => [m, 0]));
  const commissionsByMonth: Record<string, number> = Object.fromEntries(monthLabels.map((m) => [m, 0]));
  const partnersByMonth: Record<string, number> = Object.fromEntries(monthLabels.map((m) => [m, 0]));

  for (const row of (trendBookings || []) as any[]) {
    if (row.payment_status !== "paid") continue;
    const m = new Date(row.created_at).toLocaleDateString("en-IN", { month: "short" });
    if (m in salesByMonth) salesByMonth[m] += Number(row.payment_amount || row.treatment_price || 0);
  }
  for (const row of activeCommissions as any[]) {
    if (!["approved", "paid"].includes(String(row.status))) continue;
    const m = new Date(row.created_at).toLocaleDateString("en-IN", { month: "short" });
    if (m in commissionsByMonth) commissionsByMonth[m] += Number(row.amount || 0);
  }
  for (const row of (trendPartnersRaw || []) as any[]) {
    const m = new Date(row.created_at).toLocaleDateString("en-IN", { month: "short" });
    if (m in partnersByMonth) partnersByMonth[m] += 1;
  }
  const monthlyTrend = monthLabels.map((m) => ({
    month: m,
    sales: salesByMonth[m],
    commissions: commissionsByMonth[m],
    partners: partnersByMonth[m],
  }));

  const levelIncomeChart = [1, 2, 3, 4].map((level) => ({
    level: `L${level}`,
    income: filteredCommissions.filter((row: any) => Number(row.level) === level).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0),
  }));

  const periodActiveCommissions = activeCommissions.filter((row: any) => range.includes(row.created_at));
  const statusMix = ["pending", "approved", "paid"].map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: periodActiveCommissions
      .filter((row: any) => row.status === status)
      .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0),
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <AutoRefreshRoute />

      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-white via-brand-surface/60 to-brand-light/40 p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-luxury-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">{greeting}, Admin</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-brand-ink sm:text-3xl">KIA Skin Care Control Center</h1>
            <p className="mt-1.5 text-sm text-brand-muted">
              {todayLabel} &middot; {todayBookingsCount} booking{todayBookingsCount === 1 ? "" : "s"} today &middot;{" "}
              {actionItemsCount > 0 ? (
                <Link href="/admin/kyc" className="font-medium text-brand-primaryDark hover:underline">
                  {actionItemsCount} item{actionItemsCount === 1 ? "" : "s"} need{actionItemsCount === 1 ? "s" : ""} your review
                </Link>
              ) : (
                "no pending approvals"
              )}
            </p>
          </div>
          <Link
            href="/admin/treatments"
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-gradient-to-r from-brand-ink to-brand-muted px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:shadow-glow"
          >
            <Plus className="w-4 h-4" /> Add Treatment
          </Link>
        </div>
      </div>

      <DateRangeFilter range={range.range} from={resolvedSearchParams?.from} to={resolvedSearchParams?.to} />

      <div className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Current Period Financial Summary</h2>
          <p className="mt-1 text-sm text-brand-muted">All figures use verified live database records in the selected date range.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Kit Booking Sales" value={`Rs. ${paidBookingSales.toLocaleString("en-IN")}`} icon={Calendar} href="/admin/bookings" tone="sage" hint={`${paidBookingRows.length} paid booking${paidBookingRows.length === 1 ? "" : "s"}`} />
          <StatCard label="Total Memberships" value={`Rs. ${membershipRevenue.toLocaleString("en-IN")}`} icon={Users} href="/admin/memberships" tone="green" hint={`${activeMembershipRows.length} active/approved`} />
          <StatCard label="Franchise Business" value={`Rs. ${franchiseBusiness.toLocaleString("en-IN")}`} icon={Award} href="/admin/franchise-leads" tone="amber" hint={`${approvedFranchiseRows.length} approved franchise`} />
          <StatCard label="Gross Payout" value={`Rs. ${periodGrossPayout.toLocaleString("en-IN")}`} icon={Wallet} href="/admin/payouts" tone="purple" hint="Before deduction" />
          <StatCard label="15% Deduction" value={`Rs. ${periodDeduction.toLocaleString("en-IN")}`} icon={BadgeIndianRupee} href="/admin/payouts" tone="rose" hint="Admin/service fee" />
          <StatCard label="Net Payable" value={`Rs. ${periodNetPayable.toLocaleString("en-IN")}`} icon={IndianRupee} href="/admin/payouts" tone="green" hint="Payable after deduction" />
        </div>
      </div>

      {/* Operational KYC & Payout Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="KYC Completed" value={verifiedKycCount} icon={ShieldCheck} href="/admin/kyc" tone="green" hint="Verified partners" />
        <StatCard label="KYC Rejected" value={rejectedKycCount} icon={ShieldCheck} href="/admin/kyc" tone="rose" hint="Need resubmission" />
        <StatCard label="KYC Pending" value={pendingKycCount} icon={ShieldCheck} href="/admin/kyc" tone="amber" hint="Awaiting review" />
        <StatCard label="Net Payout Due" value={`Rs. ${netPayoutDue.toLocaleString("en-IN")}`} icon={Wallet} href="/admin/payouts" tone="purple" hint="After 15% deduction" />
        <StatCard label="Paid This Month" value={`Rs. ${paidThisMonth.toLocaleString("en-IN")}`} icon={Wallet} href="/admin/payouts" tone="green" hint="Current month" />
        <StatCard label="Wallet Liability" value={`Rs. ${totalWalletBalance.toLocaleString("en-IN")}`} icon={Wallet} href="/admin/payouts" tone="amber" hint="All partner wallets" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Business Opportunity Counts" subtitle="Operational counts for the selected period" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniMetric label="Kit Bookings" value={paidBookingRows.length} />
            <MiniMetric label="Memberships" value={paidMembershipRows.length} />
            <MiniMetric label="Franchise" value={approvedFranchiseRows.length} />
            <MiniMetric label="Salary Achievers" value="Not Configured" />
            <MiniMetric label="Bonus Achievers" value="Not Configured" />
          </div>
          <p className="mt-3 text-xs text-brand-muted">Salary/bonus achiever rules are not yet defined in a canonical database setting, so no fake zero is shown.</p>
        </Card>
        <Card>
          <CardHeader title="Monthly Live Partner System" subtitle="Driven by the selected date range/month" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric label="Kit Booking Business" value={`Rs. ${paidBookingSales.toLocaleString("en-IN")}`} />
            <MiniMetric label="Membership Business" value={`Rs. ${membershipRevenue.toLocaleString("en-IN")}`} />
            <MiniMetric label="Total Gross Payout" value={`Rs. ${periodGrossPayout.toLocaleString("en-IN")}`} />
            <MiniMetric label="Distributed/Paid" value={`Rs. ${paidDistributedPayout.toLocaleString("en-IN")}`} />
            <MiniMetric label="Franchise Business" value={`Rs. ${franchiseBusiness.toLocaleString("en-IN")}`} />
            <MiniMetric label="New Partners" value={newPartners} />
            <MiniMetric label="Active Partners" value={activePartnersInPeriod} />
            <MiniMetric label="Pending KYC" value={pendingKycInPeriod} />
            <MiniMetric label="Approved KYC" value={approvedKycInPeriod} />
            <MiniMetric label="Payout Requests" value={periodPendingPayouts.length} />
            <MiniMetric label="Completed Payouts" value={periodPaidPayouts.length} />
          </div>
        </Card>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Paid Booking Sales" value={`Rs. ${paidBookingSales.toLocaleString("en-IN")}`} icon={Calendar} tone="sage" hint="Selected period" />
        <StatCard label="Commission Owed" value={`Rs. ${commissionLiability.toLocaleString("en-IN")}`} icon={BadgeIndianRupee} tone="amber" hint="Pending + approved, unpaid" />
        <StatCard label="Referral Rs. 500 Owed" value={`Rs. ${referralBonusLiability.toLocaleString("en-IN")}`} icon={Users} tone="green" hint="Successful membership referrals" />
        <StatCard label="Wallet Balance" value={`Rs. ${totalWalletBalance.toLocaleString("en-IN")}`} icon={Wallet} href="/admin/payouts" tone="purple" hint="Across all partners" />
        <StatCard
          label="Action Items"
          value={actionItemsCount}
          icon={ShieldCheck}
          href="/admin/kyc"
          tone={actionItemsCount > 0 ? "rose" : "green"}
          hint={`${pendingKycCount} KYC · ${pendingPayoutsCount} payouts`}
        />
      </div>

      <AdminDashboardCharts monthlyTrend={monthlyTrend} levelIncome={levelIncomeChart} statusMix={statusMix} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Partner-wise Sales" subtitle="Confirmed and completed sales in the selected period" />
          <div className="mt-4 space-y-2">
            {topPeriodPartners.length === 0 ? (
              <p className="text-sm text-brand-muted">No partner sales in this period.</p>
            ) : topPeriodPartners.map((partner) => (
              <div key={partner.name} className="flex items-center justify-between rounded-lg bg-brand-surface/60 px-4 py-3 text-sm">
                <span className="font-medium text-brand-ink">{partner.name}</span>
                <span className="font-semibold text-brand-primary">Rs. {partner.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Earning Rules" subtitle="Referral bonus and booking commission structure" />
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-brand-surface/60 px-4 py-3 text-sm">
              <span className="font-medium text-brand-ink">Successful referral</span>
              <span className="font-semibold text-brand-accent">Rs. 500 flat</span>
            </div>
            {[
              { level: 1, rate: "6%" },
              { level: 2, rate: "3%" },
              { level: 3, rate: "1.7%" },
              { level: 4, rate: "1.2%" },
            ].map((item) => (
              <div key={item.level} className="flex items-center justify-between rounded-lg bg-brand-surface/60 px-4 py-3 text-sm">
                <span className="font-medium text-brand-ink">Level {item.level}</span>
                <span className="font-semibold text-brand-accent">{item.rate}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Urgent Action Items */}
      {actionItemsCount > 0 && (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">Requires Your Attention</h2>
              <p className="text-xs text-amber-700">{actionItemsCount} item{actionItemsCount === 1 ? "" : "s"} pending review</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pendingKycCount > 0 && (
              <Link href="/admin/kyc" className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100"><ShieldCheck className="h-4 w-4 text-amber-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{pendingKycCount} KYC Pending</p>
                    <p className="text-xs text-brand-muted">Review partner documents</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-500" />
              </Link>
            )}
            {pendingPayoutsCount > 0 && (
              <Link href="/admin/payouts" className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100"><Wallet className="h-4 w-4 text-amber-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{pendingPayoutsCount} Payouts Pending</p>
                    <p className="text-xs text-brand-muted">Process partner payments</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-500" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Business Overview Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Bookings" value={bookingsCount} icon={Calendar} href="/admin/bookings" tone="sage" hint={`${todayBookingsCount} today`} />
        <StatCard label="Memberships" value={membershipsCount} icon={CreditCard} href="/admin/memberships" tone="amber" hint={`${activeMembershipRows.length} active`} />
        <StatCard label="Partners" value={partnersCount} icon={Users} href="/admin/partners" tone="green" hint={`${activePartnersCount} active`} />
        <StatCard label="Monthly Revenue" value={`Rs. ${monthlyRevenue.toLocaleString("en-IN")}`} icon={IndianRupee} href="/admin/bookings" tone="purple" hint="This month paid bookings" />
        <StatCard label="Total Paid Out" value={`Rs. ${totalPayoutAmount.toLocaleString("en-IN")}`} icon={Wallet} href="/admin/payouts" tone="rose" hint={`${payoutsCount} total payouts`} />
      </div>

      {/* Highlights Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
          <Sparkles className="absolute -right-2 -top-2 h-16 w-16 text-emerald-100" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-emerald-600">Top Treatment</p>
          <p className="relative mt-2 text-lg font-bold text-brand-ink truncate">{topSellingTreatment}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5">
          <Award className="absolute -right-2 -top-2 h-16 w-16 text-violet-100" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-violet-600">Top Partner</p>
          <p className="relative mt-2 text-lg font-bold text-brand-ink truncate">{topPerformingPartner}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5">
          <FileText className="absolute -right-2 -top-2 h-16 w-16 text-sky-100" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-sky-600">Website Content</p>
          <p className="relative mt-2 text-lg font-bold text-brand-ink">{treatmentsCount + testimonialsCount + faqsCount + siteContentCount} items</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5">
          <Users className="absolute -right-2 -top-2 h-16 w-16 text-rose-100" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-rose-600">Expired Members</p>
          <p className="relative mt-2 text-lg font-bold text-brand-ink">{expiredMembershipsCount}</p>
        </div>
      </div>

      {/* Referral Program Summary - premium dark hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted rounded-2xl border border-brand-primary text-white">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl" />
        <div className="relative p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-medium text-white/90">
                <TrendingUp className="w-3.5 h-3.5" /> Referral Program
              </div>
              <h2 className="text-2xl font-semibold mt-3 tracking-tight text-white">Partner & Membership Overview</h2>
              <p className="text-sm text-white/75 mt-1">Multi-level commission structure with milestone bonuses.</p>
            </div>
            <Link href="/admin/partners" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg transition-colors">
              Manage Partners <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-white/75">
                <IndianRupee className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Membership</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">₹1,199</div>
              <div className="text-xs text-white/65 mt-1">One-time payment</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-white/75">
                <BadgeIndianRupee className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Min. earning</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">₹500</div>
              <div className="text-xs text-white/65 mt-1">Per direct referral</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-white/75">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Partners</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">{partnersCount}</div>
              <div className="text-xs text-white/65 mt-1">Total enrolled</div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-white/75">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider font-medium">Pending payouts</span>
              </div>
              <div className="text-2xl font-semibold mt-2 tabular-nums">{pendingPayouts.length}</div>
              <div className="text-xs text-white/65 mt-1">Awaiting approval</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-white/75 mb-3">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider font-medium">Monthly Milestone</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 15, bonus: "₹5,000" },
                { count: 25, bonus: "₹10,000" },
                { count: 35, bonus: "₹15,000" },
              ].map((m) => (
                <div key={m.count} className="bg-gradient-to-br from-brand-accent/15 to-brand-accent/5 border border-brand-accent/20 rounded-xl p-4">
                  <div className="text-xs text-white/75">{m.count} Kit Sale</div>
                  <div className="text-xl font-semibold text-white mt-1 tabular-nums">{m.bonus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-6 shadow-soft">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-accent/5 blur-2xl" />
        <h2 className="relative text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 mb-4">Quick Actions</h2>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/admin/treatments", icon: Sparkles, label: "Treatments", color: "from-emerald-500 to-teal-600" },
            { href: "/admin/bookings", icon: Calendar, label: "Bookings", color: "from-blue-500 to-indigo-600" },
            { href: "/admin/memberships", icon: CreditCard, label: "Memberships", color: "from-amber-500 to-orange-600" },
            { href: "/admin/partners", icon: Users, label: "Partners", color: "from-violet-500 to-purple-600" },
            { href: "/admin/payouts", icon: Wallet, label: "Payout Center", color: "from-rose-500 to-pink-600" },
            { href: "/admin/kyc", icon: ShieldCheck, label: "KYC Center", color: "from-cyan-500 to-blue-600" },
            { href: "/admin/commissions", icon: BadgeIndianRupee, label: "Commissions", color: "from-green-500 to-emerald-600" },
            { href: "/api/admin/payouts/export?format=csv&range=previous_month", icon: FileText, label: "Last Month Report", color: "from-slate-500 to-gray-600" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl border border-brand-border bg-white p-4 transition-all hover:border-brand-accent hover:shadow-md">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-sm`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-brand-ink group-hover:text-brand-primaryDark">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader
              title="Bookings"
              action={<Link href="/admin/bookings" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>}
            />
            <div className="mt-3 space-y-1">
              {recentBookings.length > 0 ? recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-brand-surface/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{b.customer_name}</p>
                    <p className="text-[11px] text-brand-muted mt-0.5">{b.city || "—"} &middot; {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                  <Badge variant="info" dot>{b.booking_status || "pending"}</Badge>
                </div>
              )) : <EmptyState icon={Calendar} title="No bookings" />}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Memberships"
              action={<Link href="/admin/memberships" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>}
            />
            <div className="mt-3 space-y-1">
              {recentMemberships.length > 0 ? recentMemberships.map((m: any) => {
                const v = m.membership_status === "active" ? "success" : m.membership_status === "rejected" ? "danger" : "warning";
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-brand-surface/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">{m.full_name}</p>
                      <p className="text-[11px] text-brand-muted mt-0.5">{m.city}</p>
                    </div>
                    <Badge variant={v as any} dot>{m.membership_status || "pending"}</Badge>
                  </div>
                );
              }) : <EmptyState icon={CreditCard} title="No requests" />}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Partners"
              action={<Link href="/admin/partners" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>}
            />
            <div className="mt-3 space-y-1">
              {recentPartners.length > 0 ? recentPartners.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-brand-surface/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent">
                      <span className="text-[10px] font-bold text-white">{(Array.isArray(p.profiles) ? p.profiles[0] : p.profiles)?.full_name?.[0] || "P"}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-ink truncate">{(Array.isArray(p.profiles) ? p.profiles[0] : p.profiles)?.full_name || "—"}</p>
                      <p className="text-[11px] font-mono text-brand-muted">{p.partner_code}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === "active" ? "success" : "neutral"} dot>{p.status || "—"}</Badge>
                </div>
              )) : <EmptyState icon={Users} title="No partners" />}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Payouts Queue"
              action={<Link href="/admin/payouts" className="text-xs font-medium text-brand-accent hover:underline inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>}
            />
            <div className="mt-3 space-y-1">
              {pendingPayouts.length > 0 ? pendingPayouts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-brand-surface/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{(Array.isArray(p.partner?.profiles) ? p.partner.profiles[0] : p.partner?.profiles)?.full_name || "—"}</p>
                    <p className="text-[11px] text-brand-muted mt-0.5">{new Date(p.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-primaryDark tabular-nums">Rs. {Number(p.amount).toLocaleString("en-IN")}</span>
                </div>
              )) : <EmptyState icon={Wallet} title="No pending payouts" />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface/50 px-4 py-3">
      <p className="text-xs font-medium text-brand-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
