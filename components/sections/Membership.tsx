import Link from "next/link";
import { getPublicSiteContent, getPublicSystemSettings } from "@/lib/data/public";

const defaultFeatures = [
  "Premium referral dashboard access",
  "Real-time earnings tracking",
  "Multi-level commission structure",
  "Milestone bonus rewards",
  "Transparent payout status",
];

export default async function Membership() {
  const [siteContent, systemSettings] = await Promise.all([
    getPublicSiteContent("home_membership"),
    getPublicSystemSettings(),
  ]);

  const membershipHeading = siteContent.membership_heading || "Become Our";
  const membershipDescription = siteContent.membership_description || "Experience premium skincare while unlocking an optional earning opportunity through treatment referrals and partner rewards.";
  const membershipPrice = systemSettings.membershipPrice || "1199";
  const features = systemSettings.membershipFeatures?.length > 0 ? systemSettings.membershipFeatures : defaultFeatures;
  return (
    <section id="membership" className="py-8 md:py-12">
      <div className="container-x">
        <div className="grid overflow-hidden rounded-3xl border border-brand-border/60 bg-white shadow-premium md:grid-cols-12">
          {/* Left — premium pitch */}
          <div className="p-6 md:col-span-7 md:p-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Premium Referral Partner Program
              </span>
            </div>
            <h2 className="mt-5 text-2xl md:text-3xl">
              {membershipHeading}{" "}
              <span className="text-brand-accent">
                Premium Referral Partner
              </span>
            </h2>
            <p className="mt-3 text-sm md:text-base text-brand-muted max-w-md leading-relaxed">
              {membershipDescription}
            </p>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {features.map((f: string) => (
                <li key={f} className="flex items-start gap-3 text-xs md:text-sm text-brand-ink/90">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — premium price card */}
          <div className="relative flex flex-col overflow-hidden bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted p-6 text-white md:col-span-5 md:p-8">
            {/* Decorative elements */}
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-brand-accent/20 blur-3xl"
            />
            
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/90">
                Membership Price
              </p>
              
              <div className="mt-3 space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/30 backdrop-blur-sm">
                  <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    ₹{membershipPrice}/-
                  </span>
                </div>
                <p className="text-xs text-white/90 font-medium">
                  one-time membership
                </p>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="text-xs font-semibold text-white">
                  Earn starts from ₹500 per direct referral
                </span>
              </div>

              <p className="mt-3 text-xs text-white/90 leading-relaxed">
                Start earning from your very first referral with unlimited potential.
              </p>
            </div>
            
            <div className="mt-auto pt-6 grid gap-2 relative">
              <Link
                href="/membership"
                className="inline-flex justify-center items-center gap-2 rounded-full bg-white text-brand-ink px-6 py-3 text-xs md:text-sm font-semibold hover:bg-brand-surface transition-all shadow-soft hover:shadow-card"
              >
                Book Your Membership Now
              </Link>
              <Link
                href="/referral"
                className="inline-flex justify-center rounded-full border border-white/40 text-white px-6 py-3 text-xs md:text-sm font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Explore Rewards
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
