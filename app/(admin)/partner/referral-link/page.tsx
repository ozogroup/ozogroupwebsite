import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";
import { getReferralUrl } from "@/lib/referral-url";
import ReferralShareCard from "@/components/partner/ReferralShareCard";

export const dynamic = 'force-dynamic';

export default async function PartnerReferralLinkPage() {
  await requirePartner();
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const { data: partner } = await supabase
    .from("partners" as any)
    .select("*")
    .eq("id", user.id)
    .single();

  const partnerCode = (partner as any)?.partner_code || "N/A";
  const referralLink = getReferralUrl(partnerCode);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Partner Tools</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-ink">Referral Link</h1>
        <p className="text-brand-muted">Share your clean KIA referral link and QR code.</p>
      </div>

      <ReferralShareCard partnerCode={partnerCode} referralLink={referralLink} />

      {/* Commission Structure */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission Structure</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-slate-900">Level 1 (Direct Referrals)</p>
                <p className="text-sm text-slate-600">6% commission on every treatment booking</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">6%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-medium text-slate-900">Level 2 (Network Referrals)</p>
                <p className="text-sm text-slate-600">3% commission on your direct team's referrals</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">3%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🌳</span>
              <div>
                <p className="font-medium text-slate-900">Level 3 (Extended Reach)</p>
                <p className="text-sm text-slate-600">1.7% commission on level 2 team's referrals</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">1.7%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-slate-900">Level 4 (Deep Network)</p>
                <p className="text-sm text-slate-600">1.2% commission on level 3 team's referrals</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">1.2%</span>
          </div>
        </div>
      </div>

      {/* Sales Bonuses */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales Bonuses</h2>
        <p className="text-sm text-slate-600 mb-4">Reach these milestones to earn additional bonuses:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-brand-accent/10 to-brand-light/10 rounded-lg border border-brand-accent/20">
            <p className="text-2xl font-bold text-brand-accent">10 Skincare Kits Confirmed</p>
            <p className="text-sm text-slate-700 mt-1">Bonus: ₹5,000</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-brand-accent/10 to-brand-light/10 rounded-lg border border-brand-accent/20">
            <p className="text-2xl font-bold text-brand-accent">20 Skincare Kits Confirmed</p>
            <p className="text-sm text-slate-700 mt-1">Bonus: ₹10,000</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-brand-accent/10 to-brand-light/10 rounded-lg border border-brand-accent/20">
            <p className="text-2xl font-bold text-brand-accent">30 Skincare Kits Confirmed</p>
            <p className="text-sm text-slate-700 mt-1">Bonus: ₹15,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
