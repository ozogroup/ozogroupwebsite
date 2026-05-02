import { trustBadges } from "@/lib/site";

const icons: Record<string, React.ReactNode> = {
  doctor: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  sparkle: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </svg>
  ),
  award: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14l-2 7 5-3 5 3-2-7" />
    </svg>
  ),
};

export default function TrustBadges() {
  return (
    <section aria-label="Trust badges" className="py-8 md:py-10 border-y border-brand-border bg-brand-surface/60">
      <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {trustBadges.map((b) => (
          <div
            key={b.label}
            className="flex items-center gap-3 rounded-2xl bg-white border border-brand-border px-4 py-3 shadow-soft"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
              {icons[b.icon]}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-ink leading-tight">
                {b.label}
              </p>
              <p className="text-xs text-brand-muted mt-0.5">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
