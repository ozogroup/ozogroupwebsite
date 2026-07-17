export type DateRangeParams = {
  range?: string;
  from?: string;
  to?: string;
};

export function resolveDateRange(params: DateRangeParams = {}) {
  const range = params.range || "30d";
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = new Date(now);

  if (range === "today") {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (range === "current_month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
  } else if (range === "previous_month") {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    from.setHours(0, 0, 0, 0);
    to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (range === "financial_year") {
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    from = new Date(fyStartYear, 3, 1);
    from.setHours(0, 0, 0, 0);
  } else if (range === "yesterday") {
    from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setHours(23, 59, 59, 999);
  } else if (range === "7d" || range === "30d") {
    from = new Date(now);
    from.setDate(from.getDate() - (range === "7d" ? 6 : 29));
    from.setHours(0, 0, 0, 0);
  } else if (range === "3m" || range === "6m") {
    from = new Date(now);
    from.setMonth(from.getMonth() - (range === "3m" ? 3 : 6));
    from.setHours(0, 0, 0, 0);
  } else if (range === "custom" && params.from && params.to) {
    from = new Date(`${params.from}T00:00:00`);
    to = new Date(`${params.to}T23:59:59.999`);
  } else if (range === "all") {
    from = null;
    to = null;
  }

  return {
    range,
    from,
    to,
    includes(value?: string | null) {
      if (!value) return false;
      const time = new Date(value).getTime();
      if (Number.isNaN(time)) return false;
      return (!from || time >= from.getTime()) && (!to || time <= to.getTime());
    },
  };
}
