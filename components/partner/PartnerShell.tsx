"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BadgeIndianRupee,
  Bell,
  CircleUserRound,
  Headphones,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Network,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/admin/LogoutButton";

const navigation = [
  { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/partner/profile", icon: CircleUserRound },
  { name: "KYC & Bank", href: "/partner/kyc", icon: ShieldCheck },
  { name: "Referral Link", href: "/partner/referral-link", icon: LinkIcon },
  { name: "Direct Team", href: "/partner/direct-team", icon: Users },
  { name: "My Team", href: "/partner/team", icon: Network },
  { name: "My Income", href: "/partner/income", icon: BadgeIndianRupee },
  { name: "Payout Request", href: "/partner/payouts", icon: Wallet },
  { name: "Support", href: "/partner/support", icon: Headphones },
];

export default function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#F4EBDC_0%,#DCE6D6_46%,#FFFDF8_100%)]">
      {sidebarOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-[9998] bg-brand-ink/45 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[9999] w-[304px] max-w-[88vw] transform border-r border-brand-border bg-brand-card/[0.94] text-brand-ink shadow-premium backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-brand-border/70 px-5 py-5">
            <Logo />
            <button
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-brand-muted transition hover:border-brand-accent hover:bg-brand-surface hover:text-brand-primary lg:hidden"
              aria-label="Close partner navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all ${
                    isActive
                      ? "bg-brand-ink text-white shadow-card"
                      : "text-brand-muted hover:bg-brand-surface hover:text-brand-primary"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-accent" />
                  )}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      isActive
                        ? "bg-white/[0.15] text-white"
                        : "bg-brand-card text-brand-primaryDark shadow-soft group-hover:bg-brand-ink group-hover:text-white"
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>

          <div className="border-t border-brand-border/70 p-4">
            <div className="flex items-center gap-2 rounded-2xl bg-brand-surface/80 p-2">
              <LogOut className="h-4 w-4 text-brand-muted" />
              <LogoutButton redirectTo="/partner/login" />
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[304px]">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-border bg-brand-card/[0.92] px-4 py-3 backdrop-blur-xl lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-card text-brand-primaryDark shadow-soft">
              <Bell className="h-5 w-5" />
            </span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-card text-brand-primaryDark shadow-soft transition hover:bg-brand-light"
              aria-label="Open partner navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
