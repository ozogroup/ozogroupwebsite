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

        <div className="mt-8 md:mt-12 grid gap-3 md:gap-6 grid-cols-3">
          {salesBonuses.map((bonus, i) => (
            <div
              key={bonus.bookings}
              className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-brand-primary to-brand-accent text-white p-4 md:p-8 shadow-premium hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                aria-hidden
                className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"
              />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white/20 text-white text-[10px] md:text-xs font-semibold">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="md:w-[14px] md:h-[14px]">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Bonus
                </div>
                <p className="mt-3 md:mt-6 text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-none">
                  {bonus.bonus}
                </p>
                <p className="mt-1.5 md:mt-2 text-[10px] md:text-base text-white/90 font-medium leading-tight">
                  {bonus.bookings} confirmed referrals
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
