"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { resolvePartnerLoginEmail } from "@/lib/actions/partner-login";

function toIndianAuthPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return value.trim().startsWith("+") ? value.trim() : "";
}

export default function PartnerForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const login = identifier.trim();
    if (!login) {
      setMessage({ type: "error", text: "Please enter your email or mobile number" });
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      if (login.includes("@")) {
        const { error } = await supabase.auth.resetPasswordForEmail(login.toLowerCase(), {
          redirectTo: baseUrl + "/partner/reset-password",
        });
        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({ type: "success", text: "Password reset link sent. Check your email and click the link to set your password." });
        }
        return;
      }

      const phone = toIndianAuthPhone(login);
      if (!phone) {
        setMessage({ type: "error", text: "Please enter a valid mobile number" });
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        const resolved = await resolvePartnerLoginEmail(login);
        if (resolved.email) {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(resolved.email, {
            redirectTo: baseUrl + "/partner/reset-password",
          });
          if (resetError) {
            setMessage({ type: "error", text: resetError.message });
          } else {
            setMessage({ type: "success", text: "Password reset link sent to the email registered with this mobile number." });
          }
        } else {
          setMessage({ type: "error", text: error.message });
        }
      } else {
        setOtpPhone(phone);
        setMessage({ type: "success", text: "OTP sent to your registered mobile number." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!otp.trim()) {
      setMessage({ type: "error", text: "Please enter the OTP" });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Password and Confirm Password do not match." });
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        phone: otpPhone,
        token: otp.trim(),
        type: "sms",
      });

      if (otpError) {
        setMessage({ type: "error", text: otpError.message });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
      } else {
        setMessage({ type: "success", text: "Password reset successfully. You can now login." });
        setOtp("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="bg-brand-card rounded-2xl border border-brand-border shadow-premium p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-ink mb-2">Set Your Password</h1>
            <p className="text-brand-muted">Enter your partner email or mobile number to reset your password</p>
          </div>
          {message && (
            <div className={"mb-6 p-4 rounded-lg border " + (message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700")}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}
          {!otpPhone ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-brand-ink mb-2">Partner Email or Mobile Number</label>
                <input id="identifier" type="text" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="partner@example.com or 9876543210" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-primaryDark focus:ring-4 focus:ring-brand-primary/20 transition-all disabled:opacity-60">
                {loading ? "Sending..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-brand-ink mb-2">OTP</label>
                <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Enter OTP" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-ink mb-2">New Password</label>
                <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Minimum 8 characters" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-ink mb-2">Confirm Password</label>
                <PasswordInput id="confirmPassword" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-brand-border bg-brand-card text-brand-ink rounded-lg focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all" placeholder="Re-enter password" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-primaryDark focus:ring-4 focus:ring-brand-primary/20 transition-all disabled:opacity-60">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link href="/partner/login" className="text-sm text-brand-primaryDark hover:text-brand-ink transition-colors">Back to Partner Login</Link>
          </div>
        </div>
        <div className="text-center mt-8 text-sm text-brand-muted">&copy; 2026 KIA Skin Care. All rights reserved.</div>
      </div>
    </div>
  );
}
