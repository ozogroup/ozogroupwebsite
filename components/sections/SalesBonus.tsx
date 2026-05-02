import type { SalesBonus as SalesBonusType } from "@/types";

const tiers: SalesBonusType[] = [
  { bookings: 10, bonus: "₹5,000" },
  { bookings: 20, bonus: "₹10,000" },
  { bookings: 30, bonus: "₹15,000" },
];

export default function SalesBonus() {
  return (
    <section id="bonus" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Direct Sales Bonus</span>
          <h2 className="mt-3">Hit your milestones, unlock bigger rewards</h2>
          <p className="mt-4">
            Beyond referrals, you earn lump-sum bonuses every time you cross a
            booking milestone. The more you grow, the more you earn.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((t, i) => (
            <div
              key={t.bookings}
              className="card relative overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-accent/10"
              />
              <p className="relative text-xs uppercase tracking-wider font-semibold text-brand-accent">
                Tier {i + 1}
              </p>
              <p className="relative mt-2 text-2xl font-semibold text-brand-ink">
                {t.bookings} Bookings
              </p>
              <div className="relative mt-4 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-semibold text-brand-primary">
                  {t.bonus}
                </span>
                <span className="text-sm text-brand-muted">bonus</span>
              </div>
              <p className="relative mt-3 text-sm text-brand-muted">
                Achieve {t.bookings} confirmed bookings to unlock this reward.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
