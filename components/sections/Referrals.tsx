import Link from "next/link";
import { getPublicSiteContent, getPublicCommissionSettings } from "@/lib/data/public";

export default async function Referrals() {
  const [siteContent, commissionSettings] = await Promise.all([
    getPublicSiteContent("home_referral"),
    getPublicCommissionSettings(),
  ]);

  const referralHeading = siteContent.referral_heading || "Earn Unlimited";
  const referralDescription = siteContent.referral_description || "Active partners can share premium IA Skin Care treatments and earn commission when referrals are confirmed. Completely optional — our treatments remain accessible to everyone.";
  const referralLevels = commissionSettings.referralLevels;
  const salesBonuses = commissionSettings.salesBonuses;
  return (
    <section id="referrals" className="section bg-gradient-to-b from-white to-brand-surface/30">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Premium Rewards
            </span>
          </span>
          <h2 className="mt-6">
            {referralHeading}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
              Referral Rewards
            </span>
          </h2>
          <p className="mt-4 text-base text-brand-muted max-w-2xl mx-auto leading-relaxed">
            {referralDescription}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-accent/10 text-brand-accent px-5 py-2.5 text-xs font-semibold border border-brand-accent/20">
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
            Referral rewards available for active partners
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* Commission Levels */}
          <div className="lg:col-span-7">
            <div className="rounded-[32px] border border-brand-border/60 bg-white shadow-premium p-8 md:p-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-accent to-brand-light flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-brand-accent">
                  Multi-Level Commission Structure
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {referralLevels.map((l: any, index: number) => (
                  <div
                    key={l.level}
                    className="rounded-2xl bg-gradient-to-br from-brand-surface to-white border border-brand-border/80 p-5 hover:shadow-soft transition-shadow"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
                      {l.level}
                    </p>
                    <p className="mt-1 text-sm text-brand-ink/80">{l.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-brand-primary">
                      {l.rate}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20 p-5">
                <p className="text-sm text-brand-ink">
                  <span className="font-semibold text-brand-primary">Example:</span> On an ₹18,000 treatment, 
                  your direct 6% commission ={" "}
                  <span className="font-bold text-brand-accent text-base">₹1,080</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sales Bonuses */}
          <div className="lg:col-span-5">
            <div className="rounded-[32px] border border-brand-border/60 bg-white shadow-premium p-8 md:p-10 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-brand-accent">
                  Milestone Bonus Rewards
                </p>
              </div>
              <ul className="mt-5 space-y-3 flex-1">
                {salesBonuses.map((b: any, index: number) => (
                  <li
                    key={b.bookings}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand-surface to-white border border-brand-border/80 hover:border-brand-accent/30 transition-all"
                  >
                    <div>
                      <p className="text-sm text-brand-ink">
                        <span className="font-bold text-brand-primary text-lg">{b.bookings}</span>
                        <span className="text-brand-muted ml-1">successful referrals</span>
                      </p>
                    </div>
                    <span className="text-xl font-bold text-brand-accent">
                      {b.bonus}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="#membership"
                className="btn-secondary mt-6 self-center justify-center"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
