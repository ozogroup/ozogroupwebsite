import { Award } from "lucide-react";
import { salesBonuses } from "@/lib/site";

export default function EarningsHighlight() {
  return (
    <section className="section bg-[#F8F4EC]">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9CAF88]/35 bg-white px-4 py-2 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Performance Rewards
            </span>
          </div>
          <h2 className="mt-6">Monthly Bonus Rewards</h2>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Earn additional monthly rewards when you complete confirmed kit sale milestones.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-3 md:gap-6">
          {salesBonuses.map((bonus, i) => (
            <div
              key={bonus.bookings}
              className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#5B4E4A] to-[#6E5E58] p-7 text-white shadow-[0_20px_50px_rgba(91,78,74,0.18)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_58px_rgba(91,78,74,0.26)] sm:p-8 lg:p-10"
            >
              <div aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D9C896] to-transparent" />
              <div aria-hidden className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#9CAF88]/15 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EDE5D8]">
                    Milestone {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#9CAF88]/25 text-[#F8F4EC]">
                    <Award size={20} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-8 text-2xl font-semibold text-white">
                  {bonus.bookings} Kit Sales
                </p>
                <div className="my-5 h-px w-12 bg-[#D9C896] transition-all duration-300 group-hover:w-20" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
                  Bonus Reward
                </p>
                <p className="mt-2 text-4xl font-bold leading-none text-white sm:text-5xl lg:text-6xl">
                  {bonus.bonus}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-brand-muted sm:text-base">
            Bonuses are applicable on confirmed monthly kit sales only.
          </p>
        </div>
      </div>
    </section>
  );
}
