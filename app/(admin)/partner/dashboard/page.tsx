import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  await requirePartner();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-brand-ink mb-2">
            {partnerStatus === "pending" ? "Approval Pending" : "Account Inactive"}
          </h2>
          <p className="text-brand-muted">
            Your account status is "{partnerStatus}". Please contact the administrator for help.
          </p>
        </div>
      </div>
    );
  }

  const [referrals, directTeam, commissionsData, payoutsData, bookingsData, salesData] =
    await Promise.all([
      supabase.from("referral_tree" as any).select("*", { count: "exact", head: true }).eq("ancestor_id", user.id),
      supabase.from("referral_tree" as any).select("*", { count: "exact", head: true }).eq("ancestor_id", user.id).eq("level", 1),
      supabase.from("commissions" as any).select("amount,status,created_at").eq("partner_id", user.id),
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
    ]);

  const commissions = (commissionsData as any)?.data || [];
  const payouts = (payoutsData as any)?.data || [];
  const bookings = (bookingsData as any)?.data || [];
  const sales = (salesData as any)?.data || [];

  const totalEarnings = commissions.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const pendingEarnings = commissions
    .filter((c: any) => c.status === "pending")
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
  const thisMonthEarnings = sales
    .filter((s: any) => {
      const d = new Date(s.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, s: any) => sum + Number(s.commission_amount || 0), 0);

  const kitStats = sales.reduce((acc: Record<string, { count: number; sales: number }>, s: any) => {
    const kit = s.kit_name || s.treatment_name || "Unknown";
    acc[kit] = acc[kit] || { count: 0, sales: 0 };
    acc[kit].count += 1;
    acc[kit].sales += Number(s.treatment_price || 0);
    return acc;
  }, {});
  const topSellingKit = Object.entries(kitStats).sort((a: any, b: any) => b[1].count - a[1].count)[0]?.[0] || "No sales yet";

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://ozo.group"}/?ref=${partnerCode}`;
  const whatsappMessage = encodeURIComponent(
    `Book OZO / IA Skin Care with my referral code: ${partnerCode}\n\n${referralLink}`
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-ink">Partner Dashboard</h1>
        <p className="text-sm text-brand-muted">Live sales, bookings, kit tracking, and earnings.</p>
      </div>

      {!membershipActive && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Membership expired. Referral earnings and payout requests are disabled until renewal.
        </div>
      )}

      <div className="bg-gradient-to-r from-brand-primary to-brand-accent rounded-xl shadow-glow p-6 text-white">
        <h2 className="font-display text-lg font-semibold mb-2">Your Production Referral Link</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input readOnly value={referralLink} className="flex-1 px-4 py-2.5 bg-white/20 rounded-lg text-white outline-none border border-white/30" />
          <Link href={`https://wa.me/?text=${whatsappMessage}`} target="_blank" className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold text-center hover:bg-green-600 transition-colors">
            Share
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Sales" value={`₹${totalSales.toLocaleString("en-IN")}`} />
        <Stat label="Total Bookings" value={bookings.length} />
        <Stat label="Total Referrals" value={referrals.count || 0} />
        <Stat label="Earnings" value={`₹${totalEarnings.toLocaleString("en-IN")}`} tone="green" />
        <Stat label="Pending Payout" value={`₹${pendingPayout.toLocaleString("en-IN")}`} tone="orange" />
        <Stat label="Paid Payout" value={`₹${paidPayout.toLocaleString("en-IN")}`} />
        <Stat label="This Month Earnings" value={`₹${thisMonthEarnings.toLocaleString("en-IN")}`} tone="green" />
        <Stat label="Confirmed Treatments" value={confirmedTreatments} tone="accent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel title="Top Selling Kit">
          <p className="text-xl font-bold text-brand-ink">{topSellingKit}</p>
        </Panel>
        <Panel title="Membership">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Start" value={membershipStart ? new Date(membershipStart).toLocaleDateString() : "-"} />
            <Info label="Expiry" value={membershipExpiry ? new Date(membershipExpiry).toLocaleDateString() : "-"} />
            <Info label="Remaining" value={`${remainingDays} days`} />
            <Info label="Status" value={membershipActive ? "Active" : "Expired"} />
          </div>
        </Panel>
        <Panel title="Earnings Breakdown">
          <Info label="Pending" value={`₹${pendingEarnings.toLocaleString("en-IN")}`} />
          <Info label="Paid" value={`₹${paidEarnings.toLocaleString("en-IN")}`} />
          <Info label="Wallet" value={`₹${Number(partnerData?.wallet_balance || 0).toLocaleString("en-IN")}`} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Kit-wise Sales">
          <div className="space-y-3">
            {Object.entries(kitStats).length === 0 ? (
              <p className="text-sm text-brand-muted">No kit sales yet.</p>
            ) : (
              Object.entries(kitStats).map(([kit, stat]: any) => (
                <div key={kit} className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                  <div>
                    <p className="font-medium text-brand-ink">{kit}</p>
                    <p className="text-xs text-brand-muted">{stat.count} bookings</p>
                  </div>
                  <p className="font-semibold text-brand-ink">₹{stat.sales.toLocaleString("en-IN")}</p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Recent Bookings">
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-brand-muted">No referred bookings yet.</p>
            ) : (
              bookings.slice(0, 6).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                  <div>
                    <p className="font-medium text-brand-ink">{booking.customer_name}</p>
                    <p className="text-xs text-brand-muted">{booking.treatment_name || "Treatment"} • {booking.customer_phone}</p>
                  </div>
                  <span className="text-xs capitalize px-2 py-1 rounded-full bg-brand-surface text-brand-ink">{booking.booking_status}</span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Quick href="/partner/referral-link" label="Share Link" />
        <Quick href="/partner/kyc" label="KYC & Bank" />
        <Quick href="/partner/income" label="My Income" />
        <Quick href="/partner/payouts" label="Request Payout" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "ink" }: { label: string; value: React.ReactNode; tone?: "ink" | "green" | "orange" | "accent" }) {
  const color = tone === "green" ? "text-green-600" : tone === "orange" ? "text-orange-600" : tone === "accent" ? "text-brand-accent" : "text-brand-ink";
  return (
    <div className="bg-white rounded-xl shadow-soft p-5 border border-brand-border">
      <p className="text-sm text-brand-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
      <h2 className="font-display text-lg font-semibold text-brand-ink mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

function Quick({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="p-5 rounded-xl border border-brand-border bg-white hover:border-brand-accent hover:bg-brand-surface transition-colors text-center text-sm font-medium text-brand-ink">
      {label}
    </Link>
  );
}
