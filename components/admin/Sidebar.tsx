"use client";

import LogoutButton from "./LogoutButton";
import Navigation from "./sidebar/Navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[9999] w-[260px] max-w-[86vw] bg-slate-900 transform transition-transform duration-300 ease-in-out lg:hidden ${
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
              <div>
                <span className="text-white font-semibold text-base block leading-tight">OZO Services</span>
                <span className="text-slate-400 text-xs">IA Skin Care</span>
              </div>
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
                <p className="text-xs text-slate-400 truncate">OZO Services</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-[260px] lg:bg-slate-900 lg:border-r lg:border-slate-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-bold">O</span>
            </div>
            <div>
              <span className="text-white font-semibold text-sm block leading-tight">OZO Services</span>
              <span className="text-slate-400 text-[11px]">IA Skin Care</span>
            </div>
          </div>

          {/* Navigation */}
          <Navigation />

          {/* User Profile */}
          <div className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/60 transition-colors">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-slate-400 truncate">OZO Services</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
