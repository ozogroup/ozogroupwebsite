import Link from "next/link";
import { referralLevels, salesBonuses, site } from "@/lib/site";

export default function Referrals() {
  return (
    <section id="referrals" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Optional Opportunity</span>
          <h2 className="mt-3">Earn More With OZO Referrals</h2>
          <p className="mt-3">
            Active members can refer IA Skin Care treatments and earn commission
            when their referred bookings are confirmed. Completely optional —
            our treatments are open to everyone.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-accent/10 text-brand-accent px-3.5 py-1.5 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            Referral earning is available only for active ₹{site.membershipFee} members
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Levels */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-brand-border bg-white shadow-soft p-6 md:p-7">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-brand-muted">
                Commission Levels
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {referralLevels.map((l) => (
                  <div
                    key={l.level}
                    className="rounded-2xl bg-brand-surface border border-brand-border p-4"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-brand-muted">
                      {l.level} · {l.label}
                    </p>
                    <p className="mt-1.5 text-2xl md:text-3xl font-semibold text-brand-primary">
                      {l.rate}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-brand-muted">
                Example: on an ₹18,000 treatment, your direct 6% commission ={" "}
                <span className="font-semibold text-brand-ink">₹1,080</span>.
              </p>
            </div>
          </div>

          {/* Sales Bonuses */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-brand-border bg-white shadow-soft p-6 md:p-7 h-full flex flex-col">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-brand-muted">
                Direct Sales Bonus
              </p>
              <ul className="mt-5 divide-y divide-brand-border">
                {salesBonuses.map((b) => (
                  <li
                    key={b.bookings}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm text-brand-ink">
                      <span className="font-semibold">{b.bookings}</span> confirmed direct bookings
                    </span>
                    <span className="text-base font-semibold text-brand-accent">
                      {b.bonus}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="#membership"
                className="btn-secondary mt-5 self-start"
              >
                Learn About Referrals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
