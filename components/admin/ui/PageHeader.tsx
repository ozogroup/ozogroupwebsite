import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
