"use client";

import { useState, useEffect } from "react";
import type React from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/ui/PasswordInput";

export default function PartnerResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!password || password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Password set successfully. You can now login." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-brand-muted">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size="auth" /></div>
        <div className="bg-brand-card rounded-2xl border border-brand-border shadow-premium p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-ink mb-2">Set New Password</h1>
            <p className="text-brand-muted">Choose a new password for your partner account</p>
          </div>
          {message && (
            <div className={"mb-6 p-4 rounded-lg border " + (message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700")}>
              <p className="text-sm">{message.text}</p>
              {message.type === "success" && (
                <Link href="/partner/login" className="inline-block mt-3 text-sm font-medium text-brand-accent hover:text-brand-accent/80 transition-colors">Go to Partner Login</Link>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-ink mb-2">New Password</label>
              <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Min 6 characters" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-ink mb-2">Confirm Password</label>
              <PasswordInput id="confirmPassword" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-primaryDark focus:ring-4 focus:ring-brand-primary/20 transition-all disabled:opacity-60">
              {loading ? "Setting Password..." : "Set Password"}
            </button>
          </form>
        </div>
        <div className="text-center mt-8 text-sm text-brand-muted">&copy; 2026 KIA Skin Care. All rights reserved.</div>
      </div>
    </div>
  );
}
