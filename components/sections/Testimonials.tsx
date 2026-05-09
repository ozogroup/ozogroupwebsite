import { getPublicTestimonials } from "@/lib/data/public";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-1 text-brand-accent" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.8L6 22l1.5-7.2L2 10l7.1-1.1z" />
        </svg>
      ))}
    </div>
  );
}

export default async function Testimonials() {
  const testimonials = await getPublicTestimonials();

  return (
    <section id="testimonials" className="section bg-gradient-to-b from-white to-brand-surface/50">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Client Stories
            </span>
          </div>
          <h2 className="mt-6">
            Loved by Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
              Skincare Clients
            </span>
          </h2>
          <p className="mt-4 text-base text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Real words from real clients across India. Their glow speaks louder 
            than our marketing.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className="card flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div>
                <Stars n={t.rating} />
                <blockquote className="mt-5 text-brand-ink/90 text-sm md:text-[15px] leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3 pt-4 border-t border-brand-border/60">
                <span
                  className="h-11 w-11 rounded-full shrink-0 shadow-soft"
                  style={{
                    background: `linear-gradient(135deg, #1BA3C6, #0D5C7D)`,
                  }}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{t.name}</p>
                  <p className="text-xs text-brand-muted">
                    {t.city} · {t.treatment}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
