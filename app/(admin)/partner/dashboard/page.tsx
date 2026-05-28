import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeIndianRupee,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Crown,
  Gem,
  Goal,
  Layers3,
  LineChart,
  PackageCheck,
  Send,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import BookNowButton from "@/components/booking/BookNowButton";
import PartnerDashboardCharts from "@/components/partner/PartnerDashboardCharts";
import { getSponsoredMembershipRequests } from "@/lib/actions/memberships";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";
import { getReferralUrl } from "@/lib/referral-url";
import { treatmentKitCatalog } from "@/lib/treatments/catalog";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currency.format(value || 0);
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PartnerDashboardPage() {
  const profile = await requirePartner();
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>User not found</div>;

  const { data: partner } = await supabase
    .from("partners" as any)
    .select("*")
    .eq("id", user.id)
    .single();

  const partnerData = partner as any;
  const partnerCode = partnerData?.partner_code || "N/A";
  const partnerStatus = partnerData?.status || "pending";
  const partnerName = String(profile.full_name || partnerData?.full_name || "Partner");
  const partnerInitials = partnerName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const membershipStart =
    partnerData?.membership_started_at || partnerData?.membership_purchased_at || partnerData?.created_at;
  const fallbackExpiry = membershipStart
    ? new Date(new Date(membershipStart).setFullYear(new Date(membershipStart).getFullYear() + 1)).toISOString()
    : null;
  const membershipExpiry = partnerData?.membership_expires_at || fallbackExpiry;
  const remainingDays = membershipExpiry
    ? Math.max(0, Math.ceil((new Date(membershipExpiry).getTime() - Date.now()) / 86400000))
    : 0;
  const membershipActive = partnerStatus === "active" && remainingDays > 0;

  if (partnerStatus !== "active") {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-brand-border bg-white p-8 text-center shadow-premium">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-surface text-brand-primary">
            <Crown className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-brand-ink">
            {partnerStatus === "pending" ? "Approval Pending" : "Account Inactive"}
          </h2>
          <p className="mt-2 text-brand-muted">
            Your account status is "{partnerStatus}". Please contact the administrator for help.
          </p>
        </div>
      </div>
    );
  }

  const [referrals, directTeam, referralTreeData, commissionsData, payoutsData, bookingsData, salesData, sponsoredMemberships] =
    await Promise.all([
      supabase.from("referral_tree" as any).select("*", { count: "exact", head: true }).eq("ancestor_id", user.id),
      supabase.from("referral_tree" as any).select("*", { count: "exact", head: true }).eq("ancestor_id", user.id).eq("level", 1),
      supabase.from("referral_tree" as any).select("level,created_at").eq("ancestor_id", user.id),
      supabase.from("commissions" as any).select("amount,status,created_at,level").eq("partner_id", user.id),
      supabase.from("payouts" as any).select("amount,status").eq("partner_id", user.id),
      supabase
        .from("bookings" as any)
        .select("id,customer_name,customer_phone,booking_status,created_at,treatment_name,treatment_price")
        .eq("referred_by", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("partner_sales" as any)
        .select("kit_name,treatment_name,treatment_price,booking_status,commission_amount,created_at,customer_name,customer_phone")
        .eq("partner_id", user.id)
        .order("created_at", { ascending: false }),
      getSponsoredMembershipRequests(100),
    ]);

  const commissions = (commissionsData as any)?.data || [];
  const payouts = (payoutsData as any)?.data || [];
  const bookings = (bookingsData as any)?.data || [];
  const sales = (salesData as any)?.data || [];
  const referralRows = (referralTreeData as any)?.data || [];
  const pendingRegistrations = (sponsoredMemberships as any[]).filter(
    (membership: any) => !["active", "rejected"].includes(membership.membership_status)
  );
  const approvedRegistrations = (sponsoredMemberships as any[]).filter(
    (membership: any) => membership.membership_status === "active"
  );

  const totalEarnings = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const pendingEarnings = commissions
    .filter((c: any) => c.status === "pending" || c.status === "approved")
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const paidEarnings = commissions
    .filter((c: any) => c.status === "paid")
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const pendingPayout = payouts
    .filter((p: any) => p.status === "requested" || p.status === "processing")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const paidPayout = payouts
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.treatment_price || 0), 0);
  const confirmedTreatments = sales.filter((s: any) => ["confirmed", "completed"].includes(s.booking_status)).length;
  const thisMonthEarnings = commissions
    .filter((c: any) => {
      const d = new Date(c.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

  const kitStats = sales.reduce((acc: Record<string, { count: number; sales: number }>, s: any) => {
    const kit = s.kit_name || s.treatment_name || "Unknown";
    acc[kit] = acc[kit] || { count: 0, sales: 0 };
    acc[kit].count += 1;
    acc[kit].sales += Number(s.treatment_price || 0);
    return acc;
  }, {});
  const topSellingKit = Object.entries(kitStats).sort((a: any, b: any) => b[1].count - a[1].count)[0]?.[0] || "No sales yet";

  const levelIncome = [1, 2, 3, 4, 5].map((level) => {
    const income = commissions
      .filter((c: any) => {
        const commissionLevel = Number(c.level || 1);
        return level === 5 ? commissionLevel >= 5 : commissionLevel === level;
      })
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const partners = referralRows.filter((row: any) => {
      const rowLevel = Number(row.level || 1);
      return level === 5 ? rowLevel >= 5 : rowLevel === level;
    }).length;

    return {
      level: level === 1 ? "Direct" : level === 5 ? "Level 5+" : `Level ${level}`,
      income,
      partners,
    };
  });

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: monthKey(date),
      month: date.toLocaleString("en-IN", { month: "short" }),
      sales: 0,
      earnings: 0,
      referrals: 0,
    };
  });
  const monthlyMap = new Map(months.map((item) => [item.key, item]));
  sales.forEach((sale: any) => {
    if (!sale.created_at) return;
    const bucket = monthlyMap.get(monthKey(new Date(sale.created_at)));
    if (bucket) bucket.sales += Number(sale.treatment_price || 0);
  });
  commissions.forEach((commission: any) => {
    if (!commission.created_at) return;
    const bucket = monthlyMap.get(monthKey(new Date(commission.created_at)));
    if (bucket) bucket.earnings += Number(commission.amount || 0);
  });
  referralRows.forEach((row: any) => {
    if (!row.created_at) return;
    const bucket = monthlyMap.get(monthKey(new Date(row.created_at)));
    if (bucket) bucket.referrals += 1;
  });
  const monthlyTrend = Array.from(monthlyMap.values());

  const walletBalance = Number(partnerData?.wallet_balance || 0);
  const referralLink = getReferralUrl(partnerCode);
  const whatsappMessage = encodeURIComponent(
    `Book KIA Skin Care with my Partner ID: ${partnerCode}\n\n${referralLink}`
  );
  const nextLevelTarget = Math.max(10, Math.ceil(((directTeam.count || 0) + 1) / 10) * 10);
  const targetProgress = Math.min(100, Math.round(((directTeam.count || 0) / nextLevelTarget) * 100));
  const activeBookingRate = bookings.length > 0 ? Math.round((confirmedTreatments / bookings.length) * 100) : 0;
  const catalogByName = new Map(
    treatmentKitCatalog.flatMap((kit) => [
      [kit.kitName.toLowerCase(), kit],
      [kit.title.toLowerCase(), kit],
    ])
  );
  const topKits = Object.entries(kitStats)
    .sort((a: any, b: any) => b[1].sales - a[1].sales)
    .slice(0, 4)
    .map(([name, stat]: any) => ({
      name,
      count: stat.count,
      sales: stat.sales,
      kit: catalogByName.get(String(name).toLowerCase()) || treatmentKitCatalog[0],
    }));

  const stats = [
    { label: "Total Sales", value: formatCurrency(totalSales), icon: TrendingUp, tone: "primary" },
    { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, tone: "accent" },
    { label: "Total Referrals", value: referrals.count || 0, icon: Users, tone: "rose" },
    { label: "Earnings", value: formatCurrency(totalEarnings), icon: BadgeIndianRupee, tone: "green" },
    { label: "Pending Payout", value: formatCurrency(pendingPayout), icon: Wallet, tone: "orange" },
    { label: "Paid Payout", value: formatCurrency(paidPayout), icon: CheckCircle2, tone: "primary" },
    { label: "Wallet Balance", value: formatCurrency(walletBalance), icon: Gem, tone: "accent" },
    { label: "Confirmed Treatments", value: confirmedTreatments, icon: PackageCheck, tone: "green" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/[0.82] p-5 shadow-premium backdrop-blur md:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary shadow-soft">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              Partner Growth Command Center
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-brand-ink md:text-5xl">
              Welcome back, {partnerName}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-brand-muted md:text-lg">
              Grow your team, share premium skincare, and watch every booking move your income forward.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
            <BookNowButton className="justify-center px-6 py-3.5 shadow-card hover:shadow-glow">
              Book Service / Kit
            </BookNowButton>
            <Link
              href="/partner/new-membership"
              data-testid="new-membership-registration-link"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-white px-6 py-3.5 text-sm font-semibold text-brand-primary shadow-soft transition hover:border-brand-accent hover:text-brand-accent hover:shadow-card"
            >
              New Membership Registration
              <UserPlus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PartnerVipCard
        name={partnerName}
        partnerCode={partnerCode}
        walletBalance={walletBalance}
        status={partnerStatus}
        kycStatus={partnerData?.kyc_status || "not_submitted"}
        dateOfJoining={membershipStart}
        dateOfExpiry={membershipExpiry}
        initials={partnerInitials}
      />

      {!membershipActive && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-soft">
          Membership expired. Referral earnings and payout requests are disabled until renewal.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted p-5 text-white shadow-premium md:p-7">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/[0.14] blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Your referral engine</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Keep Sharing, Keep Earning</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/90">
                Send your referral link to clients and prospects. Every confirmed booking strengthens your income dashboard.
              </p>
            </div>
            <Link
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-surface"
            >
              WhatsApp Share
              <Send className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative mt-5 flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/[0.12] p-3 backdrop-blur sm:flex-row">
            <input
              readOnly
              value={referralLink}
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/[0.14] px-4 py-3 text-sm text-white outline-none placeholder:text-white/60"
            />
            <Link
              href="/partner/referral-link"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-sm font-semibold text-brand-ink transition hover:bg-white"
            >
              Copy Tools
              <Copy className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">Next Level Target</p>
              <h2 className="mt-2 text-2xl font-semibold text-brand-ink">Grow Your Team & Income</h2>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-primary">
              <Goal className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-brand-muted">{directTeam.count || 0} direct partners</span>
              <span className="font-semibold text-brand-primary">{nextLevelTarget} target</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-brand-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-brand-muted">
              Add {Math.max(0, nextLevelTarget - (directTeam.count || 0))} more direct partners to unlock your next momentum milestone.
            </p>
          </div>
        </div>
      </section>

      <Panel
        title="Membership Registrations"
        eyebrow="Direct Team Pipeline"
        action={
          <Link href="/partner/new-membership" className="text-sm font-semibold text-brand-primary hover:text-brand-accent">
            Add new member
          </Link>
        }
      >
        {(sponsoredMemberships as any[]).length === 0 ? (
          <EmptyState title="No membership requests" text="New registrations submitted by you will remain linked here before and after admin approval." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(sponsoredMemberships as any[]).slice(0, 6).map((membership: any) => (
              <div key={membership.id} className="rounded-2xl border border-brand-border bg-brand-surface/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-ink">{membership.full_name}</p>
                    <p className="mt-1 text-sm text-brand-muted">{membership.city || "City not provided"}</p>
                  </div>
                  <StatusBadge status={membership.membership_status || membership.payment_status} />
                </div>
                <p className="mt-4 font-mono text-sm font-semibold text-brand-primaryDark">
                  {membership.partners?.partner_code || "KIA ID pending"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <PartnerDashboardCharts
        earningsBreakdown={[
          { name: "Pending", value: pendingEarnings },
          { name: "Paid", value: paidEarnings },
          { name: "Wallet", value: walletBalance },
        ]}
        monthlyTrend={monthlyTrend}
        levelIncome={levelIncome}
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Level Income Overview"
          eyebrow="Team Builder"
          action={<Link href="/partner/team" className="text-sm font-semibold text-brand-primary hover:text-brand-accent">View team</Link>}
        >
          <div className="space-y-4">
            {levelIncome.map((item, index) => {
              const maxIncome = Math.max(...levelIncome.map((level) => level.income), 1);
              return (
                <div key={item.level} className="rounded-2xl border border-brand-border bg-brand-surface/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-ink">{item.level} income</p>
                      <p className="text-xs text-brand-muted">{item.partners} partners in this level</p>
                    </div>
                    <p className="font-semibold text-brand-primary">{formatCurrency(item.income)}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-brand-primary"
                      style={{
                        width: `${Math.max(6, Math.round((item.income / maxIncome) * 100))}%`,
                        opacity: 1 - index * 0.08,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="Top Selling Kits"
          eyebrow="Sales Momentum"
          action={<span className="text-sm font-semibold text-brand-primary">{topSellingKit}</span>}
        >
          {topKits.length === 0 ? (
            <EmptyState title="No kit sales yet" text="Share your referral link and book the first premium skincare kit." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {topKits.map((item) => (
                <div key={item.name} className="group overflow-hidden rounded-2xl border border-brand-border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="relative h-36 overflow-hidden bg-brand-surface">
                    <Image
                      src={item.kit.image}
                      alt={item.kit.imageAlt}
                      fill
                      sizes="(max-width: 768px) 90vw, 320px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-brand-ink">{item.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-brand-muted">{item.count} bookings</span>
                      <span className="font-semibold text-brand-primary">{formatCurrency(item.sales)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Recent Bookings" eyebrow="Client Activity" className="xl:col-span-2">
          {bookings.length === 0 ? (
            <EmptyState title="No referred bookings yet" text="Start by sharing your referral link with warm skincare leads." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-brand-border">
              <div className="hidden grid-cols-[1fr_1fr_auto] bg-brand-surface px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted md:grid">
                <span>Client</span>
                <span>Treatment</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-brand-border">
                {bookings.slice(0, 6).map((booking: any) => (
                  <div key={booking.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                    <div>
                      <p className="font-semibold text-brand-ink">{booking.customer_name}</p>
                      <p className="text-xs text-brand-muted">{booking.customer_phone}</p>
                    </div>
                    <p className="text-sm text-brand-muted">{booking.treatment_name || "Treatment"}</p>
                    <StatusBadge status={booking.booking_status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Referral Performance" eyebrow="Conversion Pulse">
          <div className="space-y-4">
            <Metric label="Direct Team" value={directTeam.count || 0} helper="Level 1 partners" />
            <Metric label="Pending Registrations" value={pendingRegistrations.length} helper="Awaiting admin review" />
            <Metric label="Approved Direct Members" value={approvedRegistrations.length} helper="Still linked under your ID" />
            <Metric label="Booking Conversion" value={`${activeBookingRate}%`} helper="Confirmed from recent referred bookings" />
            <Metric label="This Month Earnings" value={formatCurrency(thisMonthEarnings)} helper="Fresh momentum this month" />
          </div>
          <div className="mt-5 rounded-2xl bg-brand-ink p-5 text-white">
            <p className="text-sm font-semibold text-white">Your Next Level Target</p>
            <p className="mt-2 text-sm leading-6 text-white/78">
              Grow direct referrals first. A stronger Level 1 creates better Level 2, Level 3, and Level 4 income potential.
            </p>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Book More Premium Kits",
            text: "Convert skincare interest into a booking while the client is still excited.",
            href: "/partner/dashboard",
            icon: PackageCheck,
          },
          {
            title: "Build Your Team",
            text: "Invite partners who already love beauty, wellness, and customer care.",
            href: "/partner/direct-team",
            icon: Users,
          },
          {
            title: "Track Income Daily",
            text: "Review earnings, payouts, and progress so every action feels measurable.",
            href: "/partner/income",
            icon: LineChart,
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-[1.5rem] border border-brand-border bg-white/90 p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-primary transition group-hover:bg-brand-ink group-hover:text-white">
                <item.icon className="h-6 w-6" />
              </span>
              <ArrowUpRight className="h-5 w-5 text-brand-accent transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-brand-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-brand-muted">{item.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function PartnerVipCard({
  name,
  partnerCode,
  walletBalance,
  status,
  kycStatus,
  dateOfJoining,
  dateOfExpiry,
  initials,
}: {
  name: string;
  partnerCode: string;
  walletBalance: number;
  status: string;
  kycStatus: string;
  dateOfJoining?: string | null;
  dateOfExpiry?: string | null;
  initials: string;
}) {
  const stats = [
    { label: "Wallet", value: formatCurrency(walletBalance) },
    { label: "Status", value: status || "pending" },
    { label: "KYC", value: (kycStatus || "not_submitted").replace("_", " ") },
    { label: "DOI", value: formatDisplayDate(dateOfJoining) },
    { label: "DOE", value: formatDisplayDate(dateOfExpiry) },
  ];

  return (
    <section className="group relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#f6e7b6_0%,#9c7126_30%,#2a1b13_62%,#f0d894_100%)] p-[1px] shadow-[0_28px_70px_rgba(36,24,16,0.24)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_90px_rgba(36,24,16,0.32)]">
      <div className="relative overflow-hidden rounded-[1.95rem] bg-[radial-gradient(circle_at_16%_0%,rgba(231,196,113,0.26),transparent_32%),radial-gradient(circle_at_96%_8%,rgba(156,175,146,0.16),transparent_30%),linear-gradient(135deg,#17100c_0%,#2a1b13_48%,#0f0b09_100%)] px-5 py-6 text-[#fff4d7] md:px-7 md:py-7">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#fff2bd]/80 to-transparent" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-[#d8ad4a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-12 h-56 w-56 rounded-full bg-[#9caf92]/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] transition duration-500 group-hover:opacity-[0.26]">
          <div className="absolute -left-32 top-0 h-full w-40 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-sm" />
        </div>

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4df9c,#9f762a_48%,#4b3218)] p-[1px] shadow-[0_18px_35px_rgba(0,0,0,0.32)]">
              <div className="flex h-full w-full items-center justify-center rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_25%,#6e522b,#1a110d_68%)] text-xl font-bold tracking-[0.12em] text-[#fff1bf]">
                {initials || "P"}
              </div>
            </div>
            <div className="min-w-0">
              <p className="inline-flex rounded-full border border-[#e4c877]/30 bg-[#f6e7b6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f6e7b6] shadow-inner">
                VIP Partner
              </p>
              <h2 className="mt-3 truncate text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {name}
              </h2>
              <p className="mt-2 font-mono text-sm font-semibold tracking-[0.18em] text-[#e8cf88]">
                {partnerCode || "-"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[690px] xl:grid-cols-5">
            {stats.map((stat) => (
              <VipMetric key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>

        <div className="relative mt-6 flex flex-col gap-2 border-t border-[#f6e7b6]/12 pt-4 text-[10px] uppercase tracking-[0.24em] text-[#c8b074] sm:flex-row sm:items-center sm:justify-between">
          <span>KIA Skin Care Elite Membership</span>
          <span className="text-[#f6e7b6]/80">Premium Partner Identity</span>
        </div>
      </div>
    </section>
  );
}

function VipMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f6e7b6]/14 bg-white/[0.075] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition duration-300 group-hover:border-[#f6e7b6]/24 group-hover:bg-white/[0.095]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#cbb477]">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold capitalize leading-5 text-[#fff4d7]">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "accent" | "green" | "orange" | "rose";
}) {
  const toneClass = {
    primary: "from-brand-primary/12 to-brand-primary/5 text-brand-primary",
    accent: "from-brand-accent/14 to-brand-accent/5 text-brand-accent",
    green: "from-emerald-500/14 to-emerald-500/5 text-emerald-600",
    orange: "from-brand-light/70 to-brand-surface text-brand-primaryDark",
    rose: "from-rose-500/14 to-rose-500/5 text-rose-600",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">{value}</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${toneClass}`}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[1.5rem] border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur md:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">{eyebrow}</p>
          )}
          <h2 className="mt-1 text-xl font-semibold text-brand-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "pending").toLowerCase();
  const className = ["confirmed", "completed"].includes(normalized)
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : normalized === "cancelled"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-brand-surface text-brand-muted border-brand-border";

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${className}`}>
      {normalized.replace("_", " ")}
    </span>
  );
}

function Metric({ label, value, helper }: { label: string; value: React.ReactNode; helper: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface/45 p-4">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-ink">{value}</p>
      <p className="mt-1 text-xs text-brand-muted">{helper}</p>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface/45 p-6 text-center">
      <Layers3 className="mx-auto h-8 w-8 text-brand-accent" />
      <p className="mt-3 font-semibold text-brand-ink">{title}</p>
      <p className="mt-1 text-sm text-brand-muted">{text}</p>
    </div>
  );
}
