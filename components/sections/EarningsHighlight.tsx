import { salesBonuses } from "@/lib/site";

export default function EarningsHighlight() {
  return (
    <section className="section bg-gradient-to-b from-brand-surface/50 to-white">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Direct Sales Bonus
            </span>
          </div>
          <h2 className="mt-6">
            Milestone{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
              Bonus Rewards
            </span>
          </h2>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Unlock additional bonus rewards as you achieve confirmed referral milestones.
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Bonus
                </div>
                <p className="mt-6 text-5xl md:text-6xl font-bold text-white">
                  {bonus.bonus}
                </p>
                <p className="mt-2 text-white/90 font-medium">
                  {bonus.bookings} successful referrals
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-base text-brand-muted">
            Achieve milestones to unlock additional bonus rewards on top of your referral commissions.
          </p>
        </div>
      </div>
    </section>
  );
}
