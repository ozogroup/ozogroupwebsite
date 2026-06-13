import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // TEMPORARY: Allow any authenticated user to access admin
  // Profile/role checks disabled for development
  redirect("/admin/dashboard");
}
