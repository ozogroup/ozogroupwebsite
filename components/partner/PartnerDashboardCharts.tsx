"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MoneyPoint = {
  name: string;
  value: number;
};

type TrendPoint = {
  month: string;
  sales: number;
  earnings: number;
  referrals: number;
};

type LevelPoint = {
  level: string;
  income: number;
  partners: number;
};

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const chartColors = ["#7F927A", "#9CAF92", "#DCE6D6", "#6F625C", "#4F4542"];

function formatMoney(value: number) {
  return rupee.format(value || 0);
}

function numericValue(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

export default function PartnerDashboardCharts({
  earningsBreakdown,
  monthlyTrend,
  levelIncome,
}: {
  earningsBreakdown: MoneyPoint[];
  monthlyTrend: TrendPoint[];
  levelIncome: LevelPoint[];
}) {
  const hasEarnings = earningsBreakdown.some((item) => item.value > 0);
  const donutData = hasEarnings ? earningsBreakdown : [{ name: "Start earning", value: 1 }];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
              Payout Breakdown
            </p>
            <h2 className="mt-1 text-lg font-semibold text-brand-ink">Earnings Mix</h2>
          </div>
          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-primary">
            Live
          </span>
        </div>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={hasEarnings ? 4 : 0}
                stroke="none"
              >
                {donutData.map((_, index) => (
                  <Cell
                    key={`earnings-${index}`}
                    fill={hasEarnings ? chartColors[index % chartColors.length] : "#E6DCCF"}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (hasEarnings ? formatMoney(numericValue(value)) : "No earnings yet")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {earningsBreakdown.map((item, index) => (
            <div key={item.name} className="rounded-xl bg-brand-surface/70 p-3">
              <span
                className="mb-2 block h-1.5 w-8 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <p className="text-xs text-brand-muted">{item.name}</p>
              <p className="text-sm font-semibold text-brand-ink">{formatMoney(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card xl:col-span-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
              Monthly Growth
            </p>
            <h2 className="mt-1 text-lg font-semibold text-brand-ink">Sales & Earnings Trend</h2>
          </div>
          <p className="max-w-sm text-sm text-brand-muted">
            Track the rhythm of your referrals, bookings, and income over time.
          </p>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#7F927A" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7F927A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="earningsFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#9CAF92" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#9CAF92" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E6DCCF" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#6F625C", fontSize: 12 }} />
              <YAxis
                yAxisId="money"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6F625C", fontSize: 12 }}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                width={42}
              />
              <YAxis
                yAxisId="referrals"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6F625C", fontSize: 12 }}
                width={28}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "Referrals" ? `${numericValue(value)} partners` : formatMoney(numericValue(value))
                }
                contentStyle={{
                  border: "1px solid #E6DCCF",
                  borderRadius: 14,
                  boxShadow: "0 8px 32px rgba(79, 69, 66, 0.13)",
                }}
              />
              <Area
                yAxisId="money"
                type="monotone"
                dataKey="sales"
                stroke="#7F927A"
                strokeWidth={3}
                fill="url(#salesFill)"
                name="Sales"
              />
              <Area
                yAxisId="money"
                type="monotone"
                dataKey="earnings"
                stroke="#9CAF92"
                strokeWidth={3}
                fill="url(#earningsFill)"
                name="Earnings"
              />
              <Line
                yAxisId="referrals"
                type="monotone"
                dataKey="referrals"
                stroke="#6F625C"
                strokeWidth={3}
                dot={{ r: 4, fill: "#6F625C", stroke: "#FFFDF8", strokeWidth: 2 }}
                name="Referrals"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card xl:col-span-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
              Team Income
            </p>
            <h2 className="mt-1 text-lg font-semibold text-brand-ink">Level Income Overview</h2>
          </div>
          <p className="max-w-md text-sm text-brand-muted">
            Build direct partners and let every active level strengthen your long-term earning base.
          </p>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelIncome} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#E6DCCF" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="level" tickLine={false} axisLine={false} tick={{ fill: "#6F625C", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6F625C", fontSize: 12 }}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                width={42}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "partners" ? `${numericValue(value)} partners` : formatMoney(numericValue(value))
                }
                contentStyle={{
                  border: "1px solid #E6DCCF",
                  borderRadius: 14,
                  boxShadow: "0 8px 32px rgba(79, 69, 66, 0.13)",
                }}
              />
              <Bar dataKey="income" name="Income" radius={[10, 10, 0, 0]}>
                {levelIncome.map((_, index) => (
                  <Cell key={`level-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
