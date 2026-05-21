import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function PartnerDashboardPage() {
  await requirePartner();
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  // Fetch partner data
  const { data: partner } = await supabase
    .from("partners" as any)
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const partnerCode = (partner as any)?.partner_code || "N/A";
  const partnerStatus = (partner as any)?.status || "pending";
  const walletBalance = Number((partner as any)?.wallet_balance ?? 0) || 0;

  // Block non-approved partners
  if (partnerStatus !== "active") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <span className="text-5xl mb-4 block">⏳</span>
          <h2 className="text-xl font-bold text-brand-ink mb-2">
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

  // Fetch partner stats
  const [
    { count: totalReferrals } = { count: 0 },
    { count: directTeam } = { count: 0 },
    commissionsData,
    payoutsData,
  ] = await Promise.all([
    supabase.from("referral_tree" as any).select("*", { count: "exact", head: true }).eq("ancestor_id", user.id),
    supabase.from("referral_tree" as any).select("*", { count: "exact", head: true }).eq("ancestor_id", user.id).eq("level", 1),
    supabase.from("commissions" as any).select("amount, status").eq("partner_id", user.id),
    supabase.from("payouts" as any).select("amount, status").eq("partner_id", user.id),
  ]);

  const totalEarnings = (commissionsData as any)?.data?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;
  const pendingEarnings = (commissionsData as any)?.data?.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;
  const paidEarnings = (commissionsData as any)?.data?.filter((c: any) => c.status === "paid").reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;
  const pendingPayouts = (payoutsData as any)?.data?.filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ozo.group'}/join?ref=${partnerCode}`;
  const whatsappMessage = encodeURIComponent(`Join OZO / IA Skin Care's referral program and earn commissions! Use my referral code: ${partnerCode}\n\n${referralLink}`);
  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-ink">Partner Dashboard</h1>
        <p className="text-sm text-brand-muted">Welcome back! Track your referrals and earnings.</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-accent rounded-xl shadow-glow p-6 text-white">
        <h2 className="font-display text-lg font-semibold mb-2">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-2.5 bg-white/20 rounded-lg text-white placeholder-white/70 outline-none border border-white/30"
          />
          <a
            href={referralLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-white text-brand-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Open Link
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52.075-.154.636-.636 1.758-.636 1.758-.636.636-.636 1.758-.636 1.758-.636.636.636 1.758.636 1.758-.636.636-1.758.636-1.758 1.758-1.758 1.758-1.758 1.758 1.758 1.758 1.758 1.758-1.758 1.758-1.758z"/>
            </svg>
            Share on WhatsApp
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Total Referrals</p>
          <p className="text-3xl font-bold text-brand-ink">{totalReferrals}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Direct Team</p>
          <p className="text-3xl font-bold text-brand-ink">{directTeam}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Pending Payout</p>
          <p className="text-3xl font-bold text-orange-600">₹{pendingPayouts.toLocaleString()}</p>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Pending Earnings</p>
          <p className="text-2xl font-bold text-orange-600">₹{pendingEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Paid Earnings</p>
          <p className="text-2xl font-bold text-brand-ink">₹{paidEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
          <p className="text-sm text-brand-muted mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold text-brand-accent">₹{walletBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Partner Info Card */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
        <h2 className="font-display text-lg font-semibold text-brand-ink mb-4">Partner Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-brand-muted mb-1">Partner Code</p>
            <p className="text-xl font-bold text-brand-ink">{partnerCode}</p>
          </div>
          <div>
            <p className="text-sm text-brand-muted mb-1">Membership Status</p>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
              partnerStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {partnerStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-brand-border">
        <h2 className="font-display text-lg font-semibold text-brand-ink mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/partner/referral-link" className="flex flex-col items-center p-6 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-surface transition-all text-center group">
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">🔗</span>
            <span className="text-sm font-medium text-brand-ink">Share Link</span>
          </a>
          <a href="/partner/direct-team" className="flex flex-col items-center p-6 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-surface transition-all text-center group">
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">👥</span>
            <span className="text-sm font-medium text-brand-ink">Direct Team</span>
          </a>
          <a href="/partner/income" className="flex flex-col items-center p-6 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-surface transition-all text-center group">
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">💰</span>
            <span className="text-sm font-medium text-brand-ink">My Income</span>
          </a>
          <a href="/partner/payouts" className="flex flex-col items-center p-6 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-surface transition-all text-center group">
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">💸</span>
            <span className="text-sm font-medium text-brand-ink">Request Payout</span>
          </a>
        </div>
      </div>
    </div>
  );
}
