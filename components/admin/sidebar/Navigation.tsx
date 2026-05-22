"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Star,
  MessageCircleQuestion,
  Phone,
  Users,
  CreditCard,
  Calendar,
  Activity,
  Network,
  Wallet,
  BadgeIndianRupee,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, section: "main" },
  { name: "Website Content", href: "/admin/content", icon: FileText, section: "content" },
  { name: "Treatments", href: "/admin/treatments", icon: Sparkles, section: "content" },
  { name: "Testimonials", href: "/admin/testimonials", icon: Star, section: "content" },
  { name: "FAQs", href: "/admin/faqs", icon: MessageCircleQuestion, section: "content" },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar, section: "operations" },
  { name: "Membership Requests", href: "/admin/memberships", icon: CreditCard, section: "operations" },
  { name: "Referral Partners", href: "/admin/partners", icon: Users, section: "referral" },
  { name: "Referral Network", href: "/admin/referrals", icon: Network, section: "referral" },
  { name: "Commissions", href: "/admin/commissions", icon: BadgeIndianRupee, section: "referral" },
  { name: "KYC Approvals", href: "/admin/kyc", icon: ShieldCheck, section: "referral" },
  { name: "Payouts", href: "/admin/payouts", icon: Wallet, section: "referral" },
  { name: "Media Library", href: "/admin/media", icon: ImageIcon, section: "settings" },
  { name: "Contact Settings", href: "/admin/contact", icon: Phone, section: "settings" },
  { name: "System Health", href: "/admin/system-health", icon: Activity, section: "settings" },
];

const sectionLabels: Record<string, string> = {
  main: "Overview",
  content: "Content Management",
  operations: "Operations",
  referral: "Referral Program",
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
            <h3 className="px-6 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  className={`group flex items-center mx-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-brand-accent/15 text-brand-accent border-l-2 border-brand-accent pl-[10px]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-brand-accent rounded-full" />
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
