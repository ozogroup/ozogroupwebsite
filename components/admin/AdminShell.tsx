"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bypass shell entirely for login page (no sidebar/topbar)
  const isLoginRoute = pathname === "/admin/login";

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
  }, [sidebarOpen]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile sidebar overlay - solid dark overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9998] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="px-4 md:px-6 lg:px-8 py-6 lg:py-8 min-h-screen">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
