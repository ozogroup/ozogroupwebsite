"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't use AdminShell for login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  
  return <AdminShell>{children}</AdminShell>;
}
