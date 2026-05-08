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
    desc: "Our skin experts assess your concerns and craft a personalized plan.",
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
    <section id="how-it-works" className="section">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                How It Works
              </span>
            </div>
            <h2 className="mt-6">
              Booking Your Treatment Is{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                Simple
              </span>
            </h2>
            <p className="mt-4 text-base text-brand-muted leading-relaxed">
              From online booking to post-treatment care — we keep every step 
              smooth, transparent, and premium for your convenience.
            </p>
          </div>
          <BookNowButton className="self-start md:self-auto shadow-soft hover:shadow-card transition-shadow">
            Book Consultation
          </BookNowButton>
        </div>

        <ol className="mt-8 md:mt-12 grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="relative bg-white border border-brand-border rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-semibold tracking-[0.18em] md:tracking-[0.22em] text-brand-accent">
                  STEP {s.n}
                </span>
                <span className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center text-xs md:text-sm font-bold">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-3 md:mt-5 text-sm md:text-lg font-semibold text-brand-ink leading-tight">{s.title}</h3>
              <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-brand-muted leading-relaxed line-clamp-3">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
