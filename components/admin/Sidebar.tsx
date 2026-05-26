"use client";

import LogoutButton from "./LogoutButton";
import Navigation from "./sidebar/Navigation";
import Logo from "@/components/Logo";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[9999] w-[260px] max-w-[86vw] bg-brand-primaryDark transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-brand-light/30">
            <Logo variant="light" showDivision={false} size="compact" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/75 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <Navigation onItemClick={onClose} />

          {/* User Profile */}
          <div className="p-4 border-t border-brand-light/30">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-white/70 truncate">KIA Skin Care</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-[260px] lg:bg-brand-primaryDark lg:border-r lg:border-brand-light/30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-brand-light/30">
            <Logo variant="light" showDivision={false} size="compact" />
          </div>

          {/* Navigation */}
          <Navigation />

          {/* User Profile */}
          <div className="p-3 border-t border-brand-light/30">
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-white/70 truncate">KIA Skin Care</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
