import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/helpers";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect all admin routes
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
