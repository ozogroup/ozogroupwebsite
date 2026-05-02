const features = [
  {
    title: "Advanced Treatment",
    desc: "Modern, clinical-grade procedures designed for Indian skin types.",
  },
  {
    title: "Visible Results",
    desc: "Proven outcomes you can see and feel — backed by trained experts.",
  },
  {
    title: "Safe Process",
    desc: "Strict hygiene, certified products, and doctor-supervised care.",
  },
  {
    title: "Trusted Service",
    desc: "Hundreds of happy clients with personalised follow-up support.",
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[i % paths.length]} />
    </svg>
  );
};

export default function WhyChooseUs() {
  return (
    <section id="about" className="section bg-brand-surface">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Why Choose Us</span>
          <h2 className="mt-3">A premium experience, built around your skin</h2>
          <p className="mt-4">
            We blend advanced clinical care with the warmth of personal
            consultation — so you feel confident at every step.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={f.title} className="card">
              <div className="h-11 w-11 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                <Icon i={i} />
              </div>
              <h3 className="mt-5 text-lg">{f.title}</h3>
              <p className="mt-2 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
