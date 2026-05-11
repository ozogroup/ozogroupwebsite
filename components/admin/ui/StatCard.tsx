import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  hint?: string;
  tone?: "blue" | "purple" | "amber" | "green" | "rose" | "slate" | "teal";
  trend?: { value: string; positive?: boolean };
}

const tones: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  green: { bg: "bg-emerald-50", text: "text-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
};

export default function StatCard({ label, value, icon: Icon, href, hint, tone = "slate", trend }: StatCardProps) {
  const t = tones[tone];
  const inner = (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] h-full">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg}`}>
          <Icon className={`w-5 h-5 ${t.text}`} strokeWidth={1.75} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums">{value}</div>
        <div className="text-sm text-slate-500 mt-1">{label}</div>
        {hint && <div className="text-xs text-slate-400 mt-2">{hint}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
