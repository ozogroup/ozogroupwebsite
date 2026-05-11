import { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  danger: "bg-rose-50 text-rose-700 border border-rose-100",
  info: "bg-blue-50 text-blue-700 border border-blue-100",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
  brand: "bg-brand-accent/10 text-brand-accent border border-brand-accent/20",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
  brand: "bg-brand-accent",
};

export default function Badge({ children, variant = "neutral", dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
