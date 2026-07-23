"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { ShieldCheck } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import { changePartnerPassword } from "@/lib/actions/partner-security";
import { validateStrongPassword } from "@/lib/security/password";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const passwordCheck = useMemo(() => validateStrongPassword(newPassword), [newPassword]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await changePartnerPassword(currentPassword, newPassword, confirmPassword);
      setMessage({ type: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Password could not be updated. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-border bg-white p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-surface text-brand-primaryDark">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-brand-ink">Change Password</h2>
          <p className="mt-1 text-sm leading-6 text-brand-muted">
            Enter your current password first. Your new password will be saved securely in Supabase Auth.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-brand-ink">Current Password</label>
          <PasswordInput
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-ink">New Password</label>
          <PasswordInput
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-ink">Confirm New Password</label>
          <PasswordInput
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          />
        </div>
      </div>

      <ul className="mt-5 grid gap-2 text-xs text-brand-muted sm:grid-cols-2">
        {passwordCheck.checks.map((check) => (
          <li key={check.message} className={check.ok ? "font-medium text-green-700" : ""}>
            {check.ok ? "✓" : "•"} {check.message}
          </li>
        ))}
      </ul>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-full bg-brand-ink px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-muted disabled:opacity-60"
      >
        {loading ? "Saving password..." : "Save Password"}
      </button>
    </form>
  );
}
