"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { updatePartnerAuthPassword } from "@/lib/actions/partners";

type PartnerPasswordManagerProps = {
  partnerId?: string | null;
  compact?: boolean;
};

export default function PartnerPasswordManager({
  partnerId,
  compact = false,
}: PartnerPasswordManagerProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setMessage(null);

    if (!partnerId) {
      setMessage({ type: "error", text: "Partner auth ID missing." });
      return;
    }

    setSaving(true);
    try {
      const result = await updatePartnerAuthPassword(partnerId, password);
      if (result.success) {
        setPassword("");
        setShowPassword(false);
        setMessage({ type: "success", text: result.message || "Password updated." });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update password." });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Failed to update password." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? "min-w-[260px] space-y-1" : "space-y-2"}>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-9 text-xs text-slate-900 outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 rounded-md p-1 -translate-y-1/2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || password.trim().length < 8}
          className="shrink-0 rounded-lg border border-brand-ink bg-brand-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Reset"}
        </button>
      </div>
      <p className="text-[10px] leading-4 text-slate-500">
        Current Supabase Auth password stays masked. Enter a new password to reset it.
      </p>
      {message && (
        <p className={`text-[10px] font-medium ${message.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
