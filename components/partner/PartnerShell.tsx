"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Headphones,
  LayoutDashboard,
  Link2,
  Network,
  ReceiptText,
  Trees,
  User,
  Users,
  X,
  Menu,
} from "lucide-react";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/admin/LogoutButton";

const navigation = [
  { name: "Dashboard", href: "/partner/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/partner/profile", icon: User },
  { name: "Referral Link", href: "/partner/referral-link", icon: Link2 },
  { name: "Direct Team", href: "/partner/direct-team", icon: Users },
  { name: "My Team", href: "/partner/team", icon: Trees },
  { name: "My Income", href: "/partner/income", icon: Banknote },
  { name: "Commission History", href: "/partner/commissions", icon: ReceiptText },
  { name: "Payout Request", href: "/partner/payouts", icon: Network },
  { name: "Support", href: "/partner/support", icon: Headphones },
];

type PartnerInfo = {
  full_name: string | null;
  partner_code: string | null;
  wallet_balance: number;
  total_earnings?: number;
  status: string | null;
  kyc_status?: string | null;
} | null;

function formatMoney(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString()}`;
}

function formatStatus(value: string | null | undefined) {
  return (value || "pending").replace(/_/g, " ");
}

function PartnerCard({ partnerInfo }: { partnerInfo?: PartnerInfo }) {
  if (!partnerInfo) return null;

  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 p-4 text-slate-950 shadow-xl shadow-black/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800/80">
              Partner
            </p>
            <p className="mt-1 truncate text-base font-bold leading-tight">
              {partnerInfo.full_name || "Partner"}
            </p>
            <p className="mt-1 font-mono text-xs font-semibold text-slate-800">
              {partnerInfo.partner_code || "N/A"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-950/90 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-200">
            {formatStatus(partnerInfo.status)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/35 p-2">
            <p className="text-[10px] font-semibold uppercase text-slate-800/70">
              Wallet
            </p>
            <p className="truncate text-sm font-bold">
              {formatMoney(partnerInfo.wallet_balance)}
            </p>
          </div>
          <div className="rounded-lg bg-white/35 p-2">
            <p className="text-[10px] font-semibold uppercase text-slate-800/70">
              Earnings
            </p>
            <p className="truncate text-sm font-bold">
              {formatMoney(partnerInfo.total_earnings)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className="text-slate-800/75">KYC</span>
          <span className="truncate rounded-full bg-white/35 px-2 py-1 capitalize text-slate-950">
            {formatStatus(partnerInfo.kyc_status || "not_submitted")}
          </span>
        </div>
      </div>
    </div>
  );
}

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
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [sidebarOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <Logo variant="light" />
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <PartnerCard partnerInfo={partnerInfo} />

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-amber-400/15 text-amber-200"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{item.name}</span>
            </a>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[9998] bg-black/55 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close partner menu overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[9999] w-72 max-w-[86vw] transform bg-slate-950 shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-slate-950 lg:shadow-lg">
        {sidebarContent}
      </aside>

      <div className="lg:pl-72">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
