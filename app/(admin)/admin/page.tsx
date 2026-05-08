import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["super_admin", "admin", "staff", "content_manager"];

  if (!profile || !allowedRoles.includes(profile.role as any)) {
    redirect("/unauthorized");
  }

  redirect("/admin/dashboard");
}
