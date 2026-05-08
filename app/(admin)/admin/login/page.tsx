import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";

export const dynamic = 'force-dynamic';

async function handleLogin(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[ADMIN LOGIN] Login attempt for email:", email);

  if (!email || !password) {
    console.log("[ADMIN LOGIN] Missing email or password");
    redirect("/admin/login?error=Email and password are required");
  }

  try {
    console.log("[ADMIN LOGIN] Getting Supabase server client");
    const supabase = getSupabaseServerClient();
    console.log("[ADMIN LOGIN] Supabase client initialized");

    console.log("[ADMIN LOGIN] Attempting Supabase auth with signInWithPassword");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[ADMIN LOGIN] Supabase auth error:", error);
      console.error("[ADMIN LOGIN] Error name:", error.name);
      console.error("[ADMIN LOGIN] Error message:", error.message);
      console.error("[ADMIN LOGIN] Error status:", error.status);
      redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
    }

    console.log("[ADMIN LOGIN] Auth successful, data:", data);
    
    // Verify user exists
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("[ADMIN LOGIN] No user after auth");
      redirect("/admin/login?error=Authentication failed");
    }

    console.log("[ADMIN LOGIN] User authenticated:", user.id);
    console.log("[ADMIN LOGIN] User email:", user.email);
    console.log("[ADMIN LOGIN] Redirecting to /admin/dashboard");
    
    // Direct redirect to dashboard - no profile check for now
    redirect("/admin/dashboard");
  } catch (error) {
    console.error("[ADMIN LOGIN] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ADMIN LOGIN] Error message:", errorMessage);
    redirect(`/admin/login?error=${encodeURIComponent(errorMessage)}`);
  }
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-slate-600">
              Secure access for authorized staff
            </p>
          </div>

          {/* Error Message */}
          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{searchParams.error}</p>
            </div>
          )}

          {/* Form */}
          <form action={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
                placeholder="admin@ozo.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-accent to-brand-light text-white font-semibold py-3 px-4 rounded-lg hover:from-brand-accent/90 hover:to-brand-light/90 focus:ring-4 focus:ring-brand-accent/20 transition-all"
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-sm text-slate-600 hover:text-brand-accent transition-colors"
            >
              ← Back to website
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 text-sm text-slate-500">
          © {new Date().getFullYear()} OZO / IA Skin Care. All rights reserved.
        </div>
      </div>
    </div>
  );
}
