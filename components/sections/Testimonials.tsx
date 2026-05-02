import { testimonials } from "@/lib/site";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-brand-accent" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.8L6 22l1.5-7.2L2 10l7.1-1.1z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="section bg-brand-surface">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Client Stories</span>
          <h2 className="mt-3">Loved by our skincare clients</h2>
          <p className="mt-3">
            Real words from real clients across India. Their glow speaks louder
            than our marketing.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="card flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <Stars n={t.rating} />
                <blockquote className="mt-4 text-brand-ink/90 text-sm md:text-[15px] leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3 pt-4 border-t border-brand-border">
                <span
                  className="h-10 w-10 rounded-full shrink-0"
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
