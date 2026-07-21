"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Key, Lock, Unlock, Check, Mail, ExternalLink } from "lucide-react";
import {
  generatePartnerTempPassword,
  togglePartnerAccount,
  getPartnerAccessInfo,
} from "@/lib/actions/partner-access";

interface PartnerAccessPanelProps {
  partnerId: string;
}

export default function PartnerAccessPanel({ partnerId }: PartnerAccessPanelProps) {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getPartnerAccessInfo(partnerId);
    if (result.success) setInfo(result.data);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGeneratePassword() {
    if (!window.confirm("Generate a new temporary password for this partner?\n\nTheir current password will be replaced.")) return;
    setBusy(true);
    setError("");
    setTempPw(null);
    const result = await generatePartnerTempPassword(partnerId);
    if (result.success && result.tempPassword) {
      setTempPw(result.tempPassword);
      setSuccess("Temporary password generated. Copy it now — it will not be shown again.");
    } else {
      setError(result.error || "Failed to generate password.");
    }
    setBusy(false);
  }

  async function handleToggle(activate: boolean) {
    const action = activate ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} this partner's account?`)) return;
    setBusy(true);
    setError("");
    const result = await togglePartnerAccount(partnerId, activate);
    if (result.success) {
      setSuccess(`Account ${activate ? "activated" : "deactivated"} successfully.`);
      await load();
    } else {
      setError(result.error || `Failed to ${action} account.`);
    }
    setBusy(false);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (loading) {
    return <div className="py-4 text-center text-xs text-brand-muted">Loading access info...</div>;
  }

  if (!info) return null;

  const isActive = info.status === "active";

  return (
    <section className="rounded-xl border border-brand-border p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Key className="h-4 w-4 text-brand-accent" />
        <h3 className="text-sm font-semibold text-brand-ink">Login Access</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-[10px] text-brand-muted uppercase">Partner ID</p>
          <div className="flex items-center gap-1">
            <p className="font-mono font-medium text-brand-ink">{info.partner_code}</p>
            <button type="button" onClick={() => copyText(info.partner_code, "id")} className="text-brand-muted hover:text-brand-accent">
              {copied === "id" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-brand-muted uppercase">Account</p>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div>
          <p className="text-[10px] text-brand-muted uppercase">Login Email</p>
          <p className="text-xs font-medium text-brand-ink truncate">{info.email || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-brand-muted uppercase">Last Login</p>
          <p className="text-xs font-medium text-brand-ink">
            {info.last_sign_in ? new Date(info.last_sign_in).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Never"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => copyText(info.login_url, "url")} className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2.5 py-1.5 text-[10px] font-medium text-brand-ink hover:bg-brand-surface">
          {copied === "url" ? <Check className="h-3 w-3 text-green-600" /> : <ExternalLink className="h-3 w-3" />}
          Copy Login URL
        </button>
      </div>

      {/* Temporary password */}
      {tempPw && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Temporary Password (copy now)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-amber-300 bg-white px-3 py-2 font-mono text-sm text-amber-900 select-all">{tempPw}</code>
            <button type="button" onClick={() => copyText(tempPw, "pw")} className="rounded-lg border border-amber-300 bg-white p-2 text-amber-700 hover:bg-amber-100">
              {copied === "pw" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-amber-600">This password will not be shown again after you close this panel.</p>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && !tempPw && <p className="text-xs text-green-600">{success}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={handleGeneratePassword}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-ink px-3 py-2 text-xs font-medium text-white hover:bg-brand-muted disabled:opacity-50"
        >
          <Key className="h-3 w-3" />
          Generate Temp Password
        </button>
        {isActive ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleToggle(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <Lock className="h-3 w-3" />
            Disable Account
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleToggle(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            <Unlock className="h-3 w-3" />
            Activate Account
          </button>
        )}
      </div>
    </section>
  );
}
