import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Sign out current user - Server Action
 */
export async function logoutAction() {
  "use server";
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Server Action for admin login
 */
export async function adminLogin(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Verify user has admin role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication failed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "staff"].includes(profile.role as any)) {
    await supabase.auth.signOut();
    return { error: "Unauthorized: Admin access only" };
  }

  revalidatePath("/admin");
  redirect("/admin/dashboard");
}

/**
 * Server Action for partner login
 */
export async function partnerLogin(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Verify user has partner role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication failed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "partner") {
    await supabase.auth.signOut();
    return { error: "Unauthorized: Partner access only" };
  }

  revalidatePath("/partner");
  redirect("/partner/dashboard");
}
