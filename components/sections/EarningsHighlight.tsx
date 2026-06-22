import { salesBonuses } from "@/lib/site";

export default function EarningsHighlight() {
  return (
    <section className="bg-[#F8F4EC] py-8 md:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9CAF88]/35 bg-white px-4 py-2 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
              Performance Rewards
            </span>
          </div>
          <h2 className="mt-4">Monthly Bonus Rewards</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">
            Earn additional monthly rewards when you complete confirmed kit sale milestones.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3">
          {salesBonuses.map((bonus, index) => (
            <article
              key={bonus.bookings}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5E514C] to-[#4A403C] p-4 shadow-[0_12px_30px_rgba(74,64,60,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(74,64,60,0.24)] md:px-6 md:py-5"
            >
              <div className="h-0.5 w-10 rounded-full bg-[#BFA36A]" />
              <div className="mt-3 flex items-end justify-between gap-2 md:block">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D8D0C8]">
                    Milestone {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 text-base font-semibold text-white md:text-lg">
                    {bonus.bookings} Kit Sales
                  </p>
                </div>
                <p className="text-xl font-bold leading-none text-white md:mt-2 md:text-2xl">
                  {bonus.bonus}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-brand-muted sm:text-sm">
          Bonuses are applicable on confirmed monthly kit sales only.
        </p>
      </div>
    </section>
  );
}
