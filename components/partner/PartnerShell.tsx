"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BadgeIndianRupee,
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

type PartnerInfo = {
  full_name: string | null;
  partner_code: string | null;
  wallet_balance: number;
  status: string | null;
} | null;

export default function PartnerShell({
  children,
  partnerInfo,
}: {
  children: React.ReactNode;
  partnerInfo?: PartnerInfo;
}) {
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
    <div className="min-h-screen bg-[#f7f4ee]">
      {sidebarOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[9999] w-[286px] max-w-[86vw] bg-slate-950 text-white shadow-2xl transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
            <Logo />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden h-10 w-10 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 inline-flex items-center justify-center"
              aria-label="Close partner navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {partnerInfo && (
            <div className="mx-4 mt-4 rounded-xl border border-amber-300/20 bg-white/[0.05] p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-300 to-brand-accent flex items-center justify-center text-slate-950 font-bold text-sm shrink-0">
                  {(partnerInfo.full_name || "P").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{partnerInfo.full_name || "Partner"}</p>
                  <p className="text-xs text-amber-200 font-mono">{partnerInfo.partner_code || "-"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-black/20 p-2">
                  <p className="text-slate-400">Wallet</p>
                  <p className="font-semibold text-amber-200">₹{(partnerInfo.wallet_balance || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-2">
                  <p className="text-slate-400">Status</p>
                  <p className="font-semibold capitalize">{partnerInfo.status || "pending"}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-amber-300/15 text-amber-200 border border-amber-300/20"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] p-2">
              <LogOut className="h-4 w-4 text-slate-400" />
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[286px]">
        <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Logo />
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center"
            aria-label="Open partner navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
