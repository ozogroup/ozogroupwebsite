import type { SalesBonus as SalesBonusType } from "@/types";
import { getPublicSiteContent } from "@/lib/data/public";

const tiers: SalesBonusType[] = [
  { bookings: 10, bonus: "₹5,000" },
  { bookings: 20, bonus: "₹10,000" },
  { bookings: 30, bonus: "₹15,000" },
];

export default async function SalesBonus() {
  const siteContent = await getPublicSiteContent("home_bonus");
  const eyebrow = siteContent.bonus_eyebrow || "Monthly Milestone";
  const heading = siteContent.bonus_heading || "Hit your milestones, unlock bigger rewards";
  const description =
    siteContent.bonus_description ||
    "Beyond referrals, you earn lump-sum bonuses every time you cross a booking milestone. The more you grow, the more you earn.";

  return (
    <section id="bonus" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-3">{heading}</h2>
          <p className="mt-4">
            {description}
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
                {t.bookings} Skincare Kits Confirmed
              </p>
              <div className="relative mt-4 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-semibold text-brand-primary">
                  {t.bonus}
                </span>
                <span className="text-sm text-brand-muted">bonus</span>
              </div>
              <p className="relative mt-3 text-sm text-brand-muted">
                Confirm {t.bookings} skincare kits to unlock this reward.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
