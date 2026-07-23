"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { requestPartnerPasswordReset } from "@/lib/actions/partner-security";

export default function PartnerForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; maskedEmail?: string | null } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await requestPartnerPasswordReset(identifier);
      setMessage({
        type: result.ok ? "success" : "error",
        text: result.message,
        maskedEmail: result.maskedEmail,
      });
      if (result.ok) setIdentifier("");
    } catch (err) {
      console.error(err);
      setMessage({
        type: "success",
        text: "If the provided details are registered, a password reset link has been sent to the registered email address.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex justify-center">
          <Logo size="auth" />
        </div>

        <section className="rounded-[2rem] border border-brand-border bg-brand-card p-6 shadow-premium sm:p-8">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-primaryDark">
              <MailCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-brand-ink">Forgot Password</h1>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Enter your Partner ID or registered email. If it matches an active partner account, a secure reset link will be emailed.
            </p>
          </div>

          {message && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <p>{message.text}</p>
              {message.maskedEmail && (
                <p className="mt-1 text-xs opacity-80">Registered email: {message.maskedEmail}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-brand-ink">
                Partner ID or Registered Email
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3.5 text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
                placeholder="KIA1001 or partner@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-ink px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-muted disabled:opacity-60"
            >
              {loading ? "Sending reset link..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/partner/login" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-accent">
              <ArrowLeft className="h-4 w-4" />
              Back to Partner Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
