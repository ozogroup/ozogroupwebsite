import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function PartnerReferralLinkPage() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const partnerCode = (profile as any)?.partner_code || "N/A";
  const referralLink = `https://ozo.group/join?ref=${partnerCode}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Link</h1>
        <p className="text-slate-600">Share your referral link to earn commissions</p>
      </div>

      <div className="bg-gradient-to-r from-brand-accent to-brand-light rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-xl font-semibold mb-4">Your Unique Referral Link</h2>
        <div className="bg-white/20 rounded-lg p-4 mb-4">
          <p className="text-lg font-mono break-all">{referralLink}</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white text-brand-accent rounded-lg font-medium hover:bg-white/90 transition-colors">
            Copy Link
          </button>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
            Share on WhatsApp
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission Structure</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-slate-900">Level 1 (Direct Referrals)</p>
                <p className="text-sm text-slate-600">6% commission</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">6%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-medium text-slate-900">Level 2</p>
                <p className="text-sm text-slate-600">3% commission</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">3%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🌳</span>
              <div>
                <p className="font-medium text-slate-900">Level 3</p>
                <p className="text-sm text-slate-600">1.7% commission</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">1.7%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-slate-900">Level 4</p>
                <p className="text-sm text-slate-600">1.2% commission</p>
              </div>
            </div>
            <span className="text-lg font-bold text-brand-accent">1.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
