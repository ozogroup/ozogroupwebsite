import BookNowButton from "@/components/booking/BookNowButton";

const steps = [
  {
    n: "01",
    title: "Book Online",
    desc: "Choose your treatment and preferred slot using our secure booking form.",
  },
  {
    n: "02",
    title: "Free Consultation",
    desc: "Our skin experts assess your concerns and craft a personalised plan.",
  },
  {
    n: "03",
    title: "Treatment Session",
    desc: "Relax in our premium clinic while we deliver your doctor-supervised protocol.",
  },
  {
    n: "04",
    title: "Glow & Follow-up",
    desc: "See visible results and get guided aftercare for long-lasting outcomes.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section bg-brand-surface">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="eyebrow">How It Works</span>
            <h2 className="mt-3">Booking your treatment is simple</h2>
            <p className="mt-3">
              From online booking to post-treatment care — we keep every step
              smooth, transparent, and premium.
            </p>
          </div>
          <BookNowButton className="self-start md:self-auto">
            Book Consultation
          </BookNowButton>
        </div>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="relative card group hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.22em] text-brand-accent">
                  STEP {s.n}
                </span>
                <span className="h-8 w-8 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg">{s.title}</h3>
              <p className="mt-2 text-sm">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
