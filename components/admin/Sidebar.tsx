"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { name: "Treatments", href: "/admin/treatments", icon: "💆" },
  { name: "Bookings", href: "/admin/bookings", icon: "📅" },
  { name: "Memberships", href: "/admin/memberships", icon: "👥" },
  { name: "Partners", href: "/admin/partners", icon: "🤝" },
  { name: "Referrals", href: "/admin/referrals", icon: "🔗" },
  { name: "Commissions", href: "/admin/commissions", icon: "💰" },
  { name: "Payouts", href: "/admin/payouts", icon: "💸" },
  { name: "Payments", href: "/admin/payments", icon: "💳" },
  { name: "Content", href: "/admin/content", icon: "📝" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[9999] w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <Logo />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-brand-accent/10 text-brand-accent font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center p-6 border-b border-slate-200">
            <Logo />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-brand-accent/10 text-brand-accent font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  );
}
