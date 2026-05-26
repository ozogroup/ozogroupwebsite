import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-brand-primaryDark" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
      {description && <p className="text-sm text-brand-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
