"use client";

import { useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { resolvePartnerLoginEmail } from "@/lib/actions/partner-login";

const LOGIN_ERROR = "Invalid email/mobile or password.";

export default function PartnerLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-5"
      >
        <div className="flex justify-center">
          <Logo showDivision={false} />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Partner Login</h1>
          <p className="text-slate-500 mt-2">Login to your partner dashboard</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email or Mobile Number
          </label>
          <input
            type="text"
            required
            autoComplete="username"
            inputMode="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter email or mobile number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center">
          <a
            href="/partner/forgot-password"
            className="text-sm text-cyan-600 hover:underline"
          >
            Forgot Password?
          </a>
        </div>
      </form>
    </div>
  );
}
