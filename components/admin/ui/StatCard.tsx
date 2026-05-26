import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  hint?: string;
  tone?: "sage" | "purple" | "amber" | "green" | "rose" | "slate" | "teal";
  trend?: { value: string; positive?: boolean };
}

const tones: Record<string, { bg: string; text: string }> = {
  sage: { bg: "bg-brand-light/55", text: "text-brand-primaryDark" },
  purple: { bg: "bg-brand-light/55", text: "text-brand-primaryDark" },
  amber: { bg: "bg-brand-light/55", text: "text-brand-primaryDark" },
  green: { bg: "bg-brand-light/55", text: "text-brand-primaryDark" },
  rose: { bg: "bg-brand-surface", text: "text-brand-primaryDark" },
  slate: { bg: "bg-brand-surface", text: "text-brand-muted" },
  teal: { bg: "bg-brand-light/55", text: "text-brand-primaryDark" },
};

export default function StatCard({ label, value, icon: Icon, href, hint, tone = "slate", trend }: StatCardProps) {
  const t = tones[tone];
  const inner = (
    <div className="bg-brand-card rounded-xl border border-brand-border shadow-soft p-5 transition-all duration-200 hover:border-brand-primary hover:shadow-card h-full">
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
        <div className="text-3xl font-semibold text-brand-ink tracking-tight tabular-nums">{value}</div>
        <div className="text-sm text-brand-muted mt-1">{label}</div>
        {hint && <div className="text-xs text-brand-muted/75 mt-2">{hint}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
