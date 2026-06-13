export default function DateRangeFilter({
  range = "30d",
  from = "",
  to = "",
}: {
  range?: string;
  from?: string;
  to?: string;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-2 rounded-xl border border-brand-border bg-white p-3 shadow-sm">
      <label className="text-xs font-semibold text-brand-muted">
        Period
        <select name="range" defaultValue={range} className="mt-1 block rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink">
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="all">All time</option>
          <option value="custom">Custom range</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-brand-muted">
        From
        <input type="date" name="from" defaultValue={from} className="mt-1 block rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-ink" />
      </label>
      <label className="text-xs font-semibold text-brand-muted">
        To
        <input type="date" name="to" defaultValue={to} className="mt-1 block rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-ink" />
      </label>
      <button type="submit" className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-muted">
        Apply
      </button>
    </form>
  );
}
