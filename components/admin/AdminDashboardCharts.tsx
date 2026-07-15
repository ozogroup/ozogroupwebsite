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

type TrendPoint = {
  month: string;
  sales: number;
  commissions: number;
  partners: number;
};

type LevelPoint = {
  level: string;
  income: number;
};

type StatusPoint = {
  name: string;
  value: number;
};

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const chartColors = ["#7F927A", "#9CAF92", "#DCE6D6", "#6F625C", "#4F4542"];
const statusColors: Record<string, string> = {
  Pending: "#D4AF37",
  Approved: "#7F927A",
  Paid: "#9CAF92",
};

function formatMoney(value: number) {
  return rupee.format(value || 0);
}

function numericValue(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

export default function AdminDashboardCharts({
  monthlyTrend,
  levelIncome,
  statusMix,
}: {
  monthlyTrend: TrendPoint[];
  levelIncome: LevelPoint[];
  statusMix: StatusPoint[];
}) {
  const hasStatusMix = statusMix.some((item) => item.value > 0);
  const donutData = hasStatusMix ? statusMix : [{ name: "No commissions yet", value: 1 }];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card xl:col-span-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">6-Month Growth</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-ink">Sales, Commissions &amp; New Partners</h2>
          </div>
          <p className="max-w-sm text-sm text-brand-muted">Paid booking revenue against commission liability and partner growth.</p>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="adminSalesFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#7F927A" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7F927A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminCommissionFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
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
              <YAxis yAxisId="partners" orientation="right" tickLine={false} axisLine={false} tick={{ fill: "#6F625C", fontSize: 12 }} width={28} />
              <Tooltip
                formatter={(value, name) => (name === "New Partners" ? `${numericValue(value)} joined` : formatMoney(numericValue(value)))}
                contentStyle={{ border: "1px solid #E6DCCF", borderRadius: 14, boxShadow: "0 8px 32px rgba(79, 69, 66, 0.13)" }}
              />
              <Area yAxisId="money" type="monotone" dataKey="sales" stroke="#7F927A" strokeWidth={3} fill="url(#adminSalesFill)" name="Paid Sales" />
              <Area yAxisId="money" type="monotone" dataKey="commissions" stroke="#D4AF37" strokeWidth={3} fill="url(#adminCommissionFill)" name="Commission Liability" />
              <Line
                yAxisId="partners"
                type="monotone"
                dataKey="partners"
                stroke="#4F4542"
                strokeWidth={3}
                dot={{ r: 4, fill: "#4F4542", stroke: "#FFFDF8", strokeWidth: 2 }}
                name="New Partners"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">Money Owed</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-ink">Commission Status Mix</h2>
          </div>
        </div>
        <div className="mt-5 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={hasStatusMix ? 4 : 0} stroke="none">
                {donutData.map((entry, index) => (
                  <Cell key={`status-${index}`} fill={hasStatusMix ? statusColors[entry.name] || chartColors[index % chartColors.length] : "#E6DCCF"} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (hasStatusMix ? formatMoney(numericValue(value)) : "No commissions yet")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {statusMix.map((item) => (
            <div key={item.name} className="rounded-xl bg-brand-surface/70 p-3">
              <span className="mb-2 block h-1.5 w-8 rounded-full" style={{ backgroundColor: statusColors[item.name] || "#7F927A" }} />
              <p className="text-xs text-brand-muted">{item.name}</p>
              <p className="text-sm font-semibold text-brand-ink">{formatMoney(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white/90 p-5 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-card xl:col-span-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">Referral Program</p>
            <h2 className="mt-1 text-lg font-semibold text-brand-ink">Level-wise Commission Payout (Selected Period)</h2>
          </div>
        </div>
        <div className="mt-5 h-64">
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
                formatter={(value) => formatMoney(numericValue(value))}
                contentStyle={{ border: "1px solid #E6DCCF", borderRadius: 14, boxShadow: "0 8px 32px rgba(79, 69, 66, 0.13)" }}
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
