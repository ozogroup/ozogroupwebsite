import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";

export const dynamic = 'force-dynamic';

async function handlePartnerLogin(formData: FormData) {
  "use server";
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/partner/login?error=Email and password are required");
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/partner/login?error=${encodeURIComponent(error.message)}`);
  }

  // Verify user has partner role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/partner/login?error=Authentication failed");
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[PARTNER LOGIN] Profile not found for user:", user.id, user.email);
    await supabase.auth.signOut();
    redirect("/partner/login?error=Profile not found. Please contact administrator.");
  }

  // Check role
  if (profile.role !== "partner") {
    console.warn("[PARTNER LOGIN] Non-partner role:", user.email, profile.role);
    await supabase.auth.signOut();
    redirect(`/partner/login?error=This account is not registered as a partner (current role: ${profile.role}). Please use admin login.`);
  }

  // Fetch partner status
  const { data: partnerData, error: partnerError } = await supabase
    .from("partners")
    .select("status, partner_code")
    .eq("id", user.id)
    .single();

  if (partnerError || !partnerData) {
    console.error("[PARTNER LOGIN] Partner row not found for user:", user.id, user.email);
    await supabase.auth.signOut();
    redirect("/partner/login?error=Partner profile incomplete. Please contact administrator to complete your setup.");
  }

  const partnerStatus = (partnerData as any).status;

  // Dev debug log (only visible in server logs, never in UI)
  if (process.env.NODE_ENV === "development") {
    console.log("[PARTNER LOGIN DEBUG]", {
      userId: user.id,
      email: user.email,
      profileRole: profile.role,
      partnerStatus,
      partnerCode: (partnerData as any).partner_code,
    });
  }

  if (partnerStatus === "pending") {
    await supabase.auth.signOut();
    redirect("/partner/login?error=Your partner approval is still pending. Please wait for admin approval.");
  }

  if (partnerStatus === "rejected") {
    await supabase.auth.signOut();
    redirect("/partner/login?error=Your partner request has been rejected. Please contact administrator.");
  }

  if (partnerStatus === "suspended") {
    await supabase.auth.signOut();
    redirect("/partner/login?error=Your partner account has been suspended. Please contact administrator.");
  }

  if (partnerStatus !== "approved" && partnerStatus !== "active") {
    await supabase.auth.signOut();
    redirect(`/partner/login?error=Partner account status is "${partnerStatus}". Please contact administrator.`);
  }

  redirect("/partner/dashboard");
}

export default function PartnerLoginPage({
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
              Partner Portal
            </h1>
            <p className="text-slate-600">
              Login to your partner dashboard
            </p>
          </div>

          {/* Error Message */}
          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{searchParams.error}</p>
            </div>
          )}

          {/* Form */}
          <form action={handlePartnerLogin} className="space-y-6">
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
                placeholder="partner@ozo.com"
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
              Login
            </button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/partner/forgot-password"
              className="text-sm text-brand-accent hover:text-brand-accent/80 transition-colors"
            >
              Forgot Password / Set Password
            </a>
          </div>

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
