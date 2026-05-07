import Link from "next/link";
import { site } from "@/lib/site";

const features = [
  "Premium referral dashboard access",
  "Real-time earnings tracking",
  "Multi-level commission structure",
  "Milestone bonus rewards",
  "Transparent payout status",
];

export default function Membership() {
  return (
    <section id="membership" className="section">
      <div className="container-x">
        <div className="rounded-[32px] border border-brand-border/60 bg-white shadow-premium overflow-hidden grid md:grid-cols-12">
          {/* Left — premium pitch */}
          <div className="md:col-span-7 p-8 md:p-12 lg:p-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                Premium Partner Program
              </span>
            </div>
            <h2 className="mt-6">
              Become Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                Premium Referral Partner
              </span>
            </h2>
            <p className="mt-4 text-base text-brand-muted max-w-lg leading-relaxed">
              Experience premium skincare while unlocking an optional earning opportunity 
              through treatment referrals and partner rewards.
            </p>

            <ul className="mt-8 grid sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-brand-ink/90">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — premium price card */}
          <div className="md:col-span-5 bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent text-white p-8 md:p-12 lg:p-14 flex flex-col relative overflow-hidden">
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
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-white/90">
                Membership Price
              </p>
              
              <div className="mt-4 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/30 backdrop-blur-sm">
                  <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                    ₹1,199/-
                  </span>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  one-time membership
                </p>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="text-sm font-semibold text-white">
                  Minimum ₹500 earning per referral
                </span>
              </div>

              <p className="mt-4 text-sm text-white/90 leading-relaxed">
                Start earning from your very first referral with unlimited potential.
              </p>
            </div>
            
            <div className="mt-auto pt-8 grid gap-3 relative">
              <Link
                href="/membership"
                className="inline-flex justify-center items-center gap-2 rounded-full bg-white text-brand-primary px-6 py-3.5 text-sm font-semibold hover:bg-brand-surface transition-all shadow-soft hover:shadow-card"
              >
                Book Your Membership Now
              </Link>
              <Link
                href="/referral"
                className="inline-flex justify-center rounded-full border border-white/40 text-white px-6 py-3.5 text-sm font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
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
