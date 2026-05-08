"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/admin/LogoutButton";

const navigation = [
  { name: "Dashboard", href: "/partner/dashboard", icon: "📊" },
  { name: "Profile", href: "/partner/profile", icon: "👤" },
  { name: "Referral Link", href: "/partner/referral-link", icon: "🔗" },
  { name: "Direct Team", href: "/partner/direct-team", icon: "👥" },
  { name: "My Team", href: "/partner/team", icon: "🌳" },
  { name: "My Income", href: "/partner/income", icon: "💰" },
  { name: "Commission History", href: "/partner/commissions", icon: "📜" },
  { name: "Payout Request", href: "/partner/payouts", icon: "💸" },
  { name: "Support", href: "/partner/support", icon: "📞" },
];

export default function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-[9999] w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <Logo />
            <button
              onClick={() => setSidebarOpen(false)}
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

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-brand-accent/10 text-brand-accent font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.name}
                </a>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center p-6 border-b border-slate-200">
            <Logo />
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
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
                </a>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <Logo />
          <button
            onClick={() => setSidebarOpen(true)}
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
