"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

export default function PartnerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email address" });
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: origin + "/partner/reset-password",
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({ type: "success", text: "Password reset link sent. Check your email and click the link to set your password." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Set Your Password</h1>
            <p className="text-slate-600">Enter your partner email to receive a password setup link</p>
          </div>
          {message && (
            <div className={"mb-6 p-4 rounded-lg border " + (message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700")}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Partner Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all" placeholder="partner@example.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-accent to-brand-light text-white font-semibold py-3 px-4 rounded-lg hover:from-brand-accent/90 hover:to-brand-light/90 focus:ring-4 focus:ring-brand-accent/20 transition-all disabled:opacity-60">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/partner/login" className="text-sm text-brand-accent hover:text-brand-accent/80 transition-colors">Back to Partner Login</Link>
          </div>
        </div>
        <div className="text-center mt-8 text-sm text-slate-500">OZO Services. All rights reserved.</div>
      </div>
    </div>
  );
}