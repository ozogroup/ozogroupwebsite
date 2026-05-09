"use client";

import { usePathname } from "next/navigation";

interface TopbarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/content": "Website Content",
  "/admin/treatments": "Treatments / Services",
  "/admin/bookings": "Bookings",
  "/admin/memberships": "Membership Requests",
  "/admin/partners": "Referral Partners",
  "/admin/commissions": "Commissions",
  "/admin/payouts": "Payouts",
  "/admin/testimonials": "Testimonials",
  "/admin/faqs": "FAQs",
  "/admin/contact": "Contact Settings",
  "/admin/media": "Media Library",
  "/admin/settings": "Settings",
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Admin Panel";

  return (
    <header className="bg-white border-b border-brand-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 md:px-6 py-3.5">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg hover:bg-brand-surface transition-colors"
          >
            <svg className="w-6 h-6 text-brand-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-lg md:text-xl font-semibold text-brand-ink">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-brand-muted hover:text-brand-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View site
          </a>

          <div className="flex items-center gap-3 pl-3 border-l border-brand-border">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center shadow-soft">
              <span className="text-sm font-semibold text-white">A</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-brand-ink leading-none">Admin</p>
              <p className="text-xs text-brand-muted mt-0.5">OZO Group</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
