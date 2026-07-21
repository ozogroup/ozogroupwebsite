export default function PartnerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-56 rounded-lg bg-brand-surface" />
      <div className="h-4 w-40 rounded bg-brand-surface/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-brand-border bg-brand-surface/40" />
        ))}
      </div>
      <div className="h-48 rounded-xl border border-brand-border bg-brand-surface/30" />
    </div>
  );
}
