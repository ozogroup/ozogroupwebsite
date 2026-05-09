"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊", section: "main" },
  { name: "Website CMS", href: "/admin/content", icon: "📝", section: "content" },
  { name: "Treatments", href: "/admin/treatments", icon: "💆", section: "content" },
  { name: "Bookings", href: "/admin/bookings", icon: "📅", section: "operations" },
  { name: "Partners", href: "/admin/partners", icon: "🤝", section: "referral" },
  { name: "Referrals", href: "/admin/referrals", icon: "🔗", section: "referral" },
  { name: "Commissions", href: "/admin/commissions", icon: "💰", section: "referral" },
  { name: "Payouts", href: "/admin/payouts", icon: "💸", section: "referral" },
  { name: "Media Library", href: "/admin/media", icon: "🖼️", section: "content" },
  { name: "Testimonials", href: "/admin/testimonials", icon: "⭐", section: "content" },
  { name: "FAQs", href: "/admin/faqs", icon: "❓", section: "content" },
  { name: "SEO Settings", href: "/admin/seo", icon: "🔍", section: "settings" },
  { name: "Website Settings", href: "/admin/settings", icon: "⚙️", section: "settings" },
];

const sectionLabels: Record<string, string> = {
  main: "Overview",
  content: "Content",
  operations: "Operations",
  referral: "Referral System",
  settings: "Settings",
};

interface NavigationProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export default function Navigation({ collapsed = false, onItemClick }: NavigationProps) {
  const pathname = usePathname();

  // Group navigation by section
  const groupedNav = navigation.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
    <nav className="flex-1 overflow-y-auto py-6">
      {Object.entries(groupedNav).map(([section, items]) => (
        <div key={section} className="mb-6">
          {!collapsed && (
            <h3 className="px-4 mb-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
              {sectionLabels[section] || section}
            </h3>
          )}
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center px-4 py-2.5 transition-all duration-200 ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg shadow-brand-accent/20"
                      : "text-brand-ink/70 hover:text-brand-ink hover:bg-brand-surface/50"
                  }`}
                >
                  <span className={`text-xl flex-shrink-0 ${isActive ? "text-white" : "text-brand-muted group-hover:text-brand-accent"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-glow" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
