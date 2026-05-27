import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";
import { getReferralUrl } from "@/lib/referral-url";

export const dynamic = 'force-dynamic';

export default async function PartnerReferralLinkPage() {
  await requirePartner();
  const supabase = getSupabaseServerClient();
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
  const whatsappMessage = encodeURIComponent(`Join KIA Skin Care's partner program and earn commissions! Use my Partner ID: ${partnerCode}\n\n${referralLink}`);
  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`;

  // Social share URLs
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent("Join KIA Skin Care's partner program!")}+url=${encodeURIComponent(referralLink)}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Link</h1>
        <p className="text-slate-600">Share your referral link to earn commissions</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-brand-ink to-brand-muted rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-xl font-semibold mb-4 text-white">Your Unique Referral Link</h2>
        <div className="bg-white/20 rounded-lg p-4 mb-4">
          <p className="text-lg font-mono break-all text-white">{referralLink}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="px-6 py-3 bg-white text-brand-accent rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-brand-ink text-white rounded-lg font-medium hover:bg-brand-muted transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52.075-.154.636-.636 1.758-.636 1.758-.636.636.636 1.758.636 1.758-.636.636-1.758.636-1.758 1.758-1.758 1.758-1.758 1.758 1.758 1.758 1.758-1.758 1.758-1.758z"/>
            </svg>
            WhatsApp
          </a>
          <a
            href={facebookShare}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-brand-ink text-white rounded-lg font-medium hover:bg-brand-muted transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>
          <a
            href={twitterShare}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-brand-ink text-white rounded-lg font-medium hover:bg-brand-muted transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Twitter
          </a>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">QR Code</h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
          </div>
          <div className="flex-1">
            <p className="text-slate-600 mb-4">
              Share this QR code to let people scan and join using your referral link.
            </p>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `qr-code-${partnerCode}.png`;
                link.click();
              }}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Download QR Code
            </button>
          </div>
        </div>
      </div>

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
