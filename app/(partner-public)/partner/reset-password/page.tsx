"use client";

import { useState, useEffect } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { validateStrongPassword } from "@/lib/security/password";

export default function PartnerResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    async function prepareRecoverySession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (mounted && error) {
          setMessage({ type: "error", text: "This reset link is invalid or expired. Please request a new password reset link." });
        }
      }

      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setReady(Boolean(data.session));
        setChecking(false);
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
      }
    });

    prepareRecoverySession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const passwordCheck = validateStrongPassword(password);
    if (!passwordCheck.valid) {
      const missing = passwordCheck.checks.filter((check) => !check.ok).map((check) => check.message).join(", ");
      setMessage({ type: "error", text: `Password is too weak: ${missing}.` });
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
        await supabase.auth.signOut();
        setMessage({ type: "success", text: "Your password has been updated successfully. You can now log in using your Partner ID and new password." });
        window.setTimeout(() => router.push("/partner/login?passwordReset=success"), 1500);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-3 border-brand-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-brand-muted">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-8 text-center shadow-premium">
          <div className="flex justify-center mb-6"><Logo size="auth" /></div>
          <h1 className="text-2xl font-bold text-brand-ink">Reset link expired</h1>
          <p className="mt-3 text-brand-muted">Please request a new partner password reset link.</p>
          <Link href="/partner/forgot-password" className="mt-6 inline-flex rounded-full bg-brand-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-muted">
            Request New Link
          </Link>
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
              <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Strong password" />
              <ul className="mt-3 grid gap-1 text-xs text-brand-muted sm:grid-cols-2">
                {validateStrongPassword(password).checks.map((check) => (
                  <li key={check.message} className={check.ok ? "text-green-700" : "text-brand-muted"}>
                    {check.ok ? "✓" : "•"} {check.message}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-ink mb-2">Confirm Password</label>
              <PasswordInput id="confirmPassword" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-ink text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-muted focus:ring-4 focus:ring-brand-primary/20 transition-all disabled:opacity-60">
              {loading ? "Setting Password..." : "Set Password"}
            </button>
          </form>
        </div>
        <div className="text-center mt-8 text-sm text-brand-muted">&copy; 2026 KIA Skin Care. All rights reserved.</div>
      </div>
    </div>
  );
}
