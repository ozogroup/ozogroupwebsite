import ReferralCopyButton from "@/components/partner/ReferralCopyButton";
import { requirePartner } from "@/lib/auth/helpers";
import { getReferralUrl } from "@/lib/referral-url";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString()}`;
}

function titleCase(value: string | null | undefined) {
  return (value || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function amountOf(row: any) {
  return Number(row?.amount ?? row?.commission_amount ?? 0) || 0;
}

function StatCard({
  label,
  value,
  helper,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "slate" | "green" | "amber" | "blue";
}) {
  const tones = {
    slate: "text-slate-950 bg-white",
    green: "text-green-700 bg-green-50",
    amber: "text-amber-700 bg-amber-50",
    blue: "text-blue-700 bg-blue-50",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
        {label}
      </div>
      <p className="break-words text-2xl font-bold text-slate-950 md:text-3xl">{value}</p>
      {helper && <p className="mt-2 text-sm text-slate-500">{helper}</p>}
    </div>
  );
}

function ReportCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="text-sm text-slate-500">{row.label}</span>
            <span className="text-right text-sm font-semibold text-slate-950">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function PartnerDashboardPage() {
  await requirePartner();

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const { data: partner } = await supabase
    .from("partners" as any)
    .select("id, partner_code, status, wallet_balance, total_earnings, paid_earnings, kyc_status")
    .eq("id", user.id)
    .maybeSingle();

  const partnerData = (partner || {}) as any;
  const partnerCode = partnerData.partner_code || "N/A";
  const partnerStatus = partnerData.status || "pending";
  const walletBalance = Number(partnerData.wallet_balance ?? 0) || 0;

  if (partnerStatus !== "active") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md text-center">
          <span className="mb-4 block text-5xl">...</span>
          <h2 className="mb-2 text-xl font-bold text-brand-ink">
            {partnerStatus === "pending" ? "Approval Pending" : "Account Inactive"}
          </h2>
          <p className="text-brand-muted">
            {partnerStatus === "pending"
              ? "Your partner account is pending approval. Please wait for the admin to approve your membership."
              : partnerStatus === "rejected"
              ? "Your partner request was rejected. Please contact administrator."
              : `Your account status is "${partnerStatus}". Please contact administrator.`}
          </p>
        </div>
      </div>
    );
  }

  const [
    referralTreeResult,
    commissionsResult,
    payoutsResult,
    bookingsResult,
    membershipsResult,
    clicksResult,
  ] = await Promise.all([
    supabase.from("referral_tree" as any).select("descendant_id, level").eq("ancestor_id", user.id),
    supabase.from("commissions" as any).select("amount, status, level, created_at").eq("partner_id", user.id),
    supabase.from("payouts" as any).select("amount, status, created_at, processed_at").eq("partner_id", user.id),
    supabase.from("bookings" as any).select("id, booking_status, payment_status").eq("referred_by", user.id),
    supabase.from("memberships" as any).select("id, membership_status, payment_status").eq("sponsor_id", user.id),
    supabase.from("referral_clicks" as any).select("id, converted_to_membership").eq("partner_id", user.id),
  ]);

  const referralTree = ((referralTreeResult as any)?.data || []) as any[];
  const commissions = ((commissionsResult as any)?.data || []) as any[];
  const payouts = ((payoutsResult as any)?.data || []) as any[];
  const bookings = ((bookingsResult as any)?.data || []) as any[];
  const memberships = ((membershipsResult as any)?.data || []) as any[];
  const clicks = ((clicksResult as any)?.data || []) as any[];

  const descendantIds = Array.from(new Set(referralTree.map((row) => row.descendant_id).filter(Boolean)));
  let teamPartners: any[] = [];
  if (descendantIds.length > 0) {
    const { data } = await supabase
      .from("partners" as any)
      .select("id, status")
      .in("id", descendantIds);
    teamPartners = (data || []) as any[];
  }

  const directReferrals = referralTree.filter((row) => Number(row.level) === 1).length;
  const totalNetwork = referralTree.length;
  const activePartners = teamPartners.filter((row) => row.status === "active").length;
  const pendingPartners = teamPartners.filter((row) => row.status === "pending").length;

  const totalEarnings =
    commissions.reduce((sum, row) => sum + amountOf(row), 0) ||
    Number(partnerData.total_earnings ?? 0) ||
    0;
  const paidEarnings =
    commissions
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + amountOf(row), 0) ||
    Number(partnerData.paid_earnings ?? 0) ||
    0;
  const pendingEarnings = commissions
    .filter((row) => row.status === "pending" || row.status === "approved")
    .reduce((sum, row) => sum + amountOf(row), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthEarnings = commissions
    .filter((row) => row.created_at && new Date(row.created_at) >= monthStart)
    .reduce((sum, row) => sum + amountOf(row), 0);

  const pendingPayout = payouts
    .filter((row) => ["requested", "processing", "pending"].includes(row.status))
    .reduce((sum, row) => sum + (Number(row.amount ?? 0) || 0), 0);
  const paidPayout = payouts
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + (Number(row.amount ?? 0) || 0), 0);
  const lastPaidPayout = payouts
    .filter((row) => row.status === "paid")
    .sort((a, b) => new Date(b.processed_at || b.created_at || 0).getTime() - new Date(a.processed_at || a.created_at || 0).getTime())[0];

  const confirmedBookings = bookings.filter((row) => ["confirmed", "completed"].includes(row.booking_status)).length;
  const confirmedMemberships = memberships.filter(
    (row) => row.membership_status === "active" || row.membership_status === "approved" || row.payment_status === "paid"
  ).length;
  const confirmedReferrals = Math.max(confirmedBookings, confirmedMemberships);

  const levelCounts = [1, 2, 3, 4].map((level) => ({
    level,
    count: referralTree.filter((row) => Number(row.level) === level).length,
  }));
  const bestLevel = levelCounts.reduce((best, current) => (current.count > best.count ? current : best), {
    level: 1,
    count: 0,
  });
  const bestPerformingLevel = bestLevel.count > 0 ? `Level ${bestLevel.level} (${bestLevel.count})` : "No referral data yet";
  const conversionRate = clicks.length > 0 ? `${Math.round((confirmedReferrals / clicks.length) * 100)}%` : "No click data yet";

  const referralLink = getReferralUrl(partnerCode);
  const whatsappMessage = encodeURIComponent(
    `Join OZO / IA Skin Care's referral program and earn commissions! Use my referral code: ${partnerCode}\n\n${referralLink}`
  );
  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

  const milestones = [
    { target: 10, reward: "₹5,000" },
    { target: 20, reward: "₹10,000" },
    { target: 30, reward: "₹15,000" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950 md:text-3xl">
            Partner Dashboard
          </h1>
          <p className="text-sm text-slate-500">Track referrals, payouts, earnings, and milestone progress.</p>
        </div>
        <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          {titleCase(partnerStatus)}
        </span>
      </div>

      <section className="rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-800 p-5 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-200">Referral Link</p>
            <input
              type="text"
              readOnly
              value={referralLink}
              className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:pt-8">
            <ReferralCopyButton value={referralLink} />
            <a
              href={referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/25 px-5 py-2.5 text-center font-semibold text-white transition-colors hover:bg-white/10"
            >
              Open Link
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-green-500 px-5 py-2.5 text-center font-semibold text-white transition-colors hover:bg-green-600"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Wallet Balance" value={money(walletBalance)} tone="blue" />
        <StatCard label="Total Earnings" value={money(totalEarnings)} tone="green" />
        <StatCard label="Paid Earnings" value={money(paidEarnings)} />
        <StatCard label="Pending Earnings" value={money(pendingEarnings)} tone="amber" />
        <StatCard label="Direct Referrals" value={directReferrals} />
        <StatCard label="Total Network" value={totalNetwork} />
        <StatCard label="Pending Payout" value={money(pendingPayout)} tone="amber" />
        <StatCard label="Partner Status" value={titleCase(partnerStatus)} helper={`KYC: ${titleCase(partnerData.kyc_status || "not_submitted")}`} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Referral Program</h2>
              <p className="text-sm text-slate-500">Commission levels and milestone rewards.</p>
            </div>
            <p className="text-sm font-semibold text-slate-700">{confirmedReferrals} confirmed referrals</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              ["Level 1 Direct Referral", "6%"],
              ["Level 2 Network Referral", "3%"],
              ["Level 3 Extended Reach", "1.7%"],
              ["Level 4 Deep Network", "1.2%"],
            ].map(([label, rate]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{label}</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">{rate}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Milestone Bonus Rewards
            </h3>
            {milestones.map((milestone) => {
              const progress = Math.min(100, Math.round((confirmedReferrals / milestone.target) * 100));
              const achieved = confirmedReferrals >= milestone.target;

              return (
                <div key={milestone.target} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {milestone.target} confirmed referrals = {milestone.reward}
                      </p>
                      <p className="text-sm text-slate-500">
                        {confirmedReferrals} of {milestone.target} referrals
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${achieved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {achieved ? "Achieved" : "Locked"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <ReportCard
            title="Referral Overview"
            rows={[
              { label: "Direct referrals", value: directReferrals },
              { label: "Total network", value: totalNetwork },
              { label: "Active partners", value: activePartners },
              { label: "Pending partners", value: pendingPartners },
            ]}
          />
          <ReportCard
            title="Performance Report"
            rows={[
              { label: "Confirmed referrals", value: confirmedReferrals },
              { label: "Milestone progress", value: `${Math.min(confirmedReferrals, 30)} / 30` },
              { label: "Best performing level", value: bestPerformingLevel },
              { label: "Referral conversion", value: conversionRate },
            ]}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportCard
          title="Earnings Report"
          rows={[
            { label: "Total earnings", value: money(totalEarnings) },
            { label: "This month earnings", value: money(thisMonthEarnings) },
            { label: "Pending earnings", value: money(pendingEarnings) },
            { label: "Paid earnings", value: money(paidEarnings) },
          ]}
        />
        <ReportCard
          title="Payout Report"
          rows={[
            { label: "Available balance", value: money(walletBalance) },
            { label: "Pending payout", value: money(pendingPayout) },
            { label: "Paid payout", value: money(paidPayout) },
            {
              label: "Last payout date",
              value: lastPaidPayout
                ? new Date(lastPaidPayout.processed_at || lastPaidPayout.created_at).toLocaleDateString()
                : "No paid payouts yet",
            },
          ]}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Share Referral Link", "/partner/referral-link"],
            ["View Direct Team", "/partner/direct-team"],
            ["My Income", "/partner/income"],
            ["Request Payout", "/partner/payouts"],
            ["Profile / KYC", "/partner/profile"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg border border-slate-200 px-4 py-4 text-center text-sm font-semibold text-slate-800 transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
