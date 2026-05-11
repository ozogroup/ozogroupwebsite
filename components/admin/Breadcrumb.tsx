"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  showBack?: boolean;
}

export default function Breadcrumb({ items, showBack = true }: BreadcrumbProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between mb-2">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/dashboard" className="hover:text-brand-accent transition-colors">
          Dashboard
        </Link>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-accent transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      {showBack && (
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-accent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      )}
    </div>
  );
}
