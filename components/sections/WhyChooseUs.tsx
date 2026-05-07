const features = [
  {
    title: "Advanced Treatments",
    desc: "Modern, clinical-grade procedures designed for Indian skin types with Korean and Japanese protocols.",
  },
  {
    title: "Visible Results",
    desc: "Proven outcomes you can see and feel — backed by trained skincare experts.",
  },
  {
    title: "Doctor-Supervised",
    desc: "Strict hygiene, certified products, and doctor-supervised care for your safety.",
  },
  {
    title: "Trusted Service",
    desc: "Hundreds of happy clients with personalized follow-up support and guidance.",
  },
];

const Icon = ({ i }: { i: number }) => {
  const paths = [
    "M12 2v20M2 12h20",
    "M5 12l4 4L19 6",
    "M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z",
    "M20 6L9 17l-5-5",
  ];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[i % paths.length]} />
    </svg>
  );
};

export default function WhyChooseUs() {
  return (
    <section id="about" className="section bg-gradient-to-b from-white to-brand-surface/50">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Why Choose Us
            </span>
          </div>
          <h2 className="mt-6">
            A Premium Experience, Built Around{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
              Your Skin
            </span>
          </h2>
          <p className="mt-4 text-base text-brand-muted max-w-2xl mx-auto leading-relaxed">
            We blend advanced clinical care with the warmth of personal consultation — 
            so you feel confident at every step of your skincare journey.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={f.title} className="card hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                <Icon i={i} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-brand-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-brand-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
