export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-brand-surface" />
      <div className="h-4 w-48 rounded bg-brand-surface/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-brand-border bg-brand-surface/40" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-brand-border bg-brand-surface/30" />
      <div className="h-48 rounded-xl border border-brand-border bg-brand-surface/20" />
    </div>
  );
}
