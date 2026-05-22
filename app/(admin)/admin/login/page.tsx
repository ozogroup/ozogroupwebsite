import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/ui/PasswordInput";

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
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo showDivision={false} />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-premium border border-brand-border p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-ink mb-2">
              Admin Login
            </h1>
            <p className="text-sm text-brand-muted">
              OZO Service / IA Skin Care
            </p>
          </div>

          {/* Error Message */}
          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{searchParams.error}</p>
            </div>
          )}

          {/* Form */}
          <form action={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-ink mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all bg-white text-brand-ink placeholder:text-slate-400"
                placeholder="admin@ozoservice.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-ink mb-2">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all bg-white text-brand-ink placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold py-3 px-4 rounded-lg hover:shadow-glow focus:ring-4 focus:ring-brand-accent/30 transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-border text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
