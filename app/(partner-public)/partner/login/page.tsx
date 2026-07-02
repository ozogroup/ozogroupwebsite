"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeIndianRupee, LockKeyhole, Network, ShieldCheck, Sparkles, Users } from "lucide-react";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { resolvePartnerLoginEmail } from "@/lib/actions/partner-login";

const LOGIN_ERROR = "Invalid email/mobile or password.";

export default function PartnerLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      const resolved = await resolvePartnerLoginEmail(identifier);

      if (resolved.error || !resolved.email) {
        setError(LOGIN_ERROR);
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      });

      if (loginError) {
        setError(LOGIN_ERROR);
        return;
      }

      router.push("/partner/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-surface px-4 py-8 text-brand-ink sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(156,175,146,0.20),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(127,146,122,0.16),transparent_30%),linear-gradient(135deg,rgba(255,253,248,0.95),rgba(244,235,220,0.82))]" />
        <div className="absolute left-6 top-8 h-48 w-48 rounded-full border border-brand-primary/10" />
        <div className="absolute bottom-10 right-6 h-64 w-64 rounded-full border border-brand-primary/20" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,transparent,rgba(255,253,248,0.72),transparent)]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 space-y-7 lg:order-1">
          <div className="hidden items-center gap-2 rounded-full border border-brand-border bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary shadow-soft backdrop-blur sm:inline-flex">
            <Sparkles className="h-4 w-4 text-brand-accent" />
            KIA Skin Care Partner Program
          </div>

          <div className="hidden space-y-4 sm:block">
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-brand-ink sm:text-5xl lg:text-6xl">
              Partner Login
            </h1>
            <p className="max-w-xl text-base leading-7 text-brand-muted sm:text-lg">
              Enter your secure partner space to track sales, grow your referral network, and turn skincare recommendations into daily income.
            </p>
          </div>

          <div className="relative max-w-md overflow-hidden rounded-3xl border border-[#ead38b]/70 bg-gradient-to-br from-[#f9e8a6] via-[#d7ad3c] to-[#9b6a12] p-[1px] shadow-premium">
            <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,rgba(18,18,16,0.94),rgba(78,55,11,0.88))] p-6 text-white">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f8e9b4]">VIP Partner Card</p>
                  <p className="mt-2 text-2xl font-semibold text-white">KIA Skin Care VIP</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.15] text-[#f8e9b4] ring-1 ring-white/25">
                  <BadgeIndianRupee className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/[0.15]">
                  <p className="text-[#f8e9b4]/80">Referrals</p>
                  <p className="mt-1 font-semibold text-white">Multi-level</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/[0.15]">
                  <p className="text-[#f8e9b4]/80">Access</p>
                  <p className="mt-1 font-semibold text-white">Secure</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: BadgeIndianRupee, title: "Earn Through Referrals" },
              { icon: ShieldCheck, title: "Secure Partner Access" },
              { icon: Users, title: "Grow Your Team" },
              { icon: Network, title: "Track Your Earnings" },
            ].map((item) => (
              <div
                key={item.title}
                className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/[0.78] p-4 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-card"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-primary transition group-hover:bg-brand-ink group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-brand-ink">{item.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <form
            onSubmit={handleLogin}
            className="mx-auto w-full max-w-md rounded-[2rem] border border-brand-border bg-brand-card/[0.92] p-6 shadow-premium backdrop-blur-md sm:p-8"
          >
            <div className="flex justify-center">
              <Logo showDivision={false} size="auth" />
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Welcome back</p>
              <h2 className="mt-2 text-3xl font-semibold text-brand-ink">
                <span className="sm:hidden">Partner Login</span>
                <span className="hidden sm:inline">Access Your Dashboard</span>
              </h2>
              <p className="mt-2 text-sm text-brand-muted">Login with your registered email, mobile number, or Partner ID.</p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-ink">
                  Email, Mobile Number, or Partner ID
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  inputMode="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
                  placeholder="Enter email, mobile number, or KIA ID"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-ink">
                  Password
                </label>
                <PasswordInput
                  required
                  autoComplete={remember ? "current-password" : "off"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-accent"
                />
                Remember me
              </label>
              <Link href="/partner/forgot-password" className="text-sm font-semibold text-brand-primary hover:text-brand-accent">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-brand-muted hover:shadow-glow disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-brand-muted">
              <LockKeyhole className="h-4 w-4 text-brand-accent" />
              Protected partner-only access
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
