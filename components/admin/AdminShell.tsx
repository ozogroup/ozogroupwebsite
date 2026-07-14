"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bypass shell entirely for public admin auth pages (no sidebar/topbar).
  const isPublicAdminAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Body scroll lock when sidebar is open (mobile)
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

  if (isPublicAdminAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-surface">
      {/* Mobile sidebar overlay - solid dark overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-brand-ink/55 z-[9998] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="min-w-0 lg:pl-[260px]">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="min-h-screen overflow-x-hidden px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
