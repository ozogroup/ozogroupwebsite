"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "./LogoutButton";
import Navigation from "./sidebar/Navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[9999] w-72 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-white font-semibold text-lg">OZO Admin</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <Navigation onItemClick={onClose} />

          {/* User Profile */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-slate-400 truncate">OZO Group</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:bg-gradient-to-b lg:from-slate-900 lg:to-slate-800 lg:border-r lg:border-slate-700/50 transition-all duration-300 ${
        collapsed ? "lg:w-20" : "lg:w-72"
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-lg">O</span>
                </div>
                <span className="text-white font-semibold text-lg">OZO Admin</span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center shadow-glow mx-auto">
                <span className="text-white font-bold text-lg">O</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
            >
              <svg className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <Navigation collapsed={collapsed} />

          {/* User Profile */}
          <div className="p-4 border-t border-slate-700/50">
            {!collapsed ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Admin</p>
                  <p className="text-xs text-slate-400 truncate">OZO Group</p>
                </div>
                <LogoutButton />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">A</span>
                </div>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
