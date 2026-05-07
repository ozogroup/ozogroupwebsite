import { faqs } from "@/lib/site";

export default function FAQ() {
  return (
    <section id="faq" className="section">
      <div className="container-x grid gap-12 lg:gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              FAQ
            </span>
          </div>
          <h2 className="mt-6">Questions, Answered</h2>
          <p className="mt-4 text-base text-brand-muted leading-relaxed">
            Everything you'd want to know before booking your first treatment.
            Still unsure? Reach out on WhatsApp — we respond fast.
          </p>
        </div>
        <div className="lg:col-span-8">
          <div className="divide-y divide-brand-border/60 rounded-2xl border border-brand-border/60 bg-white shadow-soft overflow-hidden">
            {faqs.map((f, i) => (
              <details
                key={f.q}
                className="group"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer px-6 md:px-7 py-5 md:py-6 list-none select-none hover:bg-brand-surface/50 transition-colors">
                  <span className="text-sm md:text-base font-semibold text-brand-ink">
                    {f.q}
                  </span>
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent transition group-open:rotate-45">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 md:px-7 pb-6 md:pb-7 -mt-1 text-sm text-brand-muted leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
