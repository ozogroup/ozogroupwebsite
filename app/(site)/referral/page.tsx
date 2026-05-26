import Link from "next/link";
import type { Metadata } from "next";
import { site, referralLevels, salesBonuses } from "@/lib/site";

export const metadata: Metadata = {
  title: "KIA Skin Care Partner Program | Premium Referrals",
  description: "Become a KIA Skin Care Partner and earn commissions by sharing premium skincare experiences with your network.",
};

export default function ReferralPage() {
  return (
    <>
      {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at 80% 0%, rgba(27,163,198,0.15) 0%, rgba(255,255,255,0) 50%), radial-gradient(ellipse at 20% 100%, rgba(93,169,214,0.12) 0%, rgba(255,255,255,0) 50%)",
            }}
          />
          <div className="container-x pt-12 md:pt-16 pb-16 md:pb-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Premium Referral Partner Program
                </span>
              </div>
              <h1 className="mt-6">
                Become a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                  Premium Referral Partner
                </span>
              </h1>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl leading-relaxed">
                Transform your network into rewards by sharing premium skincare experiences 
                with people who trust your recommendation.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/membership"
                  className="btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  Book Membership · ₹1,199
                </Link>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary justify-center"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="section bg-gradient-to-b from-white to-brand-surface/50">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Partner Benefits
                </span>
              </div>
              <h2 className="mt-6">Why Join Our Program</h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Premium Dashboard Access",
                  desc: "Track your referrals, earnings, and payouts in real-time",
                },
                {
                  title: "Real-time Earnings Tracking",
                  desc: "Monitor your commissions as they accumulate",
                },
                {
                  title: "Transparent Payout Status",
                  desc: "Know exactly when your payouts will be processed",
                },
                {
                  title: "Multi-level Reward Structure",
                  desc: "Earn commissions from direct and network referrals",
                },
                {
                  title: "Milestone Bonus Rewards",
                  desc: "Unlock additional bonuses for achieving targets",
                },
                {
                  title: "Unlimited Referral Potential",
                  desc: "No cap on how much you can earn",
                },
              ].map((benefit, i) => (
                <div
                  key={benefit.title}
                  className="card hover:-translate-y-1 transition-transform duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-brand-ink">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-brand-muted leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Earning Highlight */}
        <section className="section">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Earning Potential
                </span>
              </div>
              <h2 className="mt-6">
                Earn{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                  ₹500 Minimum
                </span>{" "}
                Per Referral
              </h2>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                With unlimited earning potential, your income grows as you build your referral network.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {salesBonuses.map((bonus, i) => (
                <div
                  key={bonus.bookings}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-accent text-white p-8 shadow-premium hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    aria-hidden
                    className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                  />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white/90 text-xs font-semibold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Bonus
                    </div>
                    <p className="mt-6 text-5xl md:text-6xl font-semibold">{bonus.bonus}</p>
                    <p className="mt-2 text-white/80">
                      {bonus.bookings} confirmed referrals
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Referral Levels */}
        <section className="section bg-gradient-to-b from-brand-surface/50 to-white">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Commission Structure
                </span>
              </div>
              <h2 className="mt-6">Multi-level Reward System</h2>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                Earn commissions not just from your direct referrals, but from your growing network.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {referralLevels.map((level, i) => (
                <div
                  key={level.level}
                  className="card hover:-translate-y-1 transition-transform duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <p className="mt-5 text-xs font-semibold tracking-[0.18em] uppercase text-brand-accent">
                    {level.level}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-brand-ink">{level.label}</h3>
                  <p className="mt-2 text-3xl font-semibold text-brand-primary">{level.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent text-white">
          <div className="container-x text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl">
                Start Your Partnership Today
              </h2>
              <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                Join the KIA Skin Care Partner Program for just ₹1,199 
                and start earning from your very first referral.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center rounded-full bg-white text-brand-primary px-8 py-4 text-sm font-semibold hover:bg-brand-surface transition-colors shadow-soft"
                >
                  Book Membership · ₹1,199
                </Link>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 text-white px-8 py-4 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Learn More on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
