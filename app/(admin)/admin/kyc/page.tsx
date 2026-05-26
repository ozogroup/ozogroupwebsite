"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { getKycSubmissions, reviewKycSubmission } from "@/lib/actions/kyc";

export default function AdminKycPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setItems(await getKycSubmissions());
    setLoading(false);
  }

  async function review(id: string, status: "verified" | "rejected" | "pending") {
    setBusy(id);
    try {
      await reviewKycSubmission(id, status, reason[id]);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to update KYC");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "KYC Management" }]} />
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">KYC Management</h1>
        <p className="text-brand-muted">Review partner documents and bank verification.</p>
      </div>

      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50 border-b border-brand-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Bank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Documents</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-muted">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-muted">
                    No KYC submissions yet
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-brand-ink">
                        {item.partner?.profiles?.full_name || item.full_name}
                      </p>
                      <p className="text-xs text-brand-muted">{item.partner?.partner_code}</p>
                      <p className="text-xs text-brand-muted">{item.mobile_number}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted">
                      <p className="font-medium text-brand-ink">{item.account_holder_name}</p>
                      <p>{item.bank_name}</p>
                      <p>AC: {item.account_number}</p>
                      <p>IFSC: {item.bank_ifsc}</p>
                      <div className="mt-2 rounded-lg bg-brand-light/50 p-2 text-xs text-brand-ink">
                        <p className="font-semibold text-brand-ink">UPI</p>
                        <p>Holder: {item.upi_holder_name || "-"}</p>
                        <p>Mobile: {item.upi_mobile || "-"}</p>
                        <p>ID: {item.upi_id || "-"}</p>
                        <p>App: {item.upi_app || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 text-sm">
                        <DocLink href={item.pan_card_url} label="PAN Card" />
                        <DocLink href={item.aadhaar_front_url} label="Aadhaar Front" />
                        <DocLink href={item.aadhaar_back_url} label="Aadhaar Back" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === "verified"
                            ? "bg-green-100 text-green-700"
                            : item.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.rejection_reason && (
                        <p className="mt-2 text-xs text-red-600 max-w-[180px]">
                          {item.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2 min-w-[220px]">
                        <textarea
                          value={reason[item.id] || ""}
                          onChange={(e) => setReason((r) => ({ ...r, [item.id]: e.target.value }))}
                          placeholder="Rejection / resubmission reason"
                          rows={2}
                          className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => review(item.id, "verified")}
                            disabled={busy === item.id}
                            className="px-3 py-1.5 text-xs rounded-lg bg-brand-primary text-white border border-brand-primary hover:bg-brand-primaryDark disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => review(item.id, "rejected")}
                            disabled={busy === item.id}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => review(item.id, "pending")}
                            disabled={busy === item.id}
                            className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
                          >
                            Resubmit
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return <span className="text-slate-400">{label}: missing</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-accent font-medium hover:underline"
    >
      View {label}
    </a>
  );
}
