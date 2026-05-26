"use client";

import { useEffect, useState } from "react";
import { getPayouts, updatePayoutStatus } from "@/lib/actions/payouts";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPayouts();
  }, []);

  async function loadPayouts() {
    setLoading(true);
    setPayouts(await getPayouts());
    setLoading(false);
  }

  async function handleUpdateStatus(id: string, status: string) {
    setBusy(id);
    try {
      await updatePayoutStatus(id, status, refs[id], notes[id]);
      await loadPayouts();
    } catch (error: any) {
      alert(error?.message || "Error updating payout status");
    } finally {
      setBusy(null);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-brand-light text-brand-primaryDark";
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Payouts</h1>
        <p className="text-sm text-brand-muted">Approve, reject, and mark partner payout requests as paid.</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-brand-surface/50 border-b border-brand-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Bank / UPI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-brand-muted">Loading...</td></tr>
              ) : payouts.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-brand-muted">No payouts found</td></tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="align-top hover:bg-brand-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-brand-ink">{payout.partner?.profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-brand-muted font-mono">{payout.partner?.partner_code || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-brand-ink font-semibold">
                      ₹{Number(payout.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted max-w-xs">
                      <p>{payout.payment_details || "-"}</p>
                      <p className="mt-1 text-xs">Method: {payout.payment_method || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted space-y-1">
                      <p>Requested: {payout.created_at ? new Date(payout.created_at).toLocaleDateString() : "-"}</p>
                      <p>Approved: {payout.approved_at ? new Date(payout.approved_at).toLocaleDateString() : "-"}</p>
                      <p>Paid: {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString() : "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2 min-w-[240px]">
                        <input
                          value={refs[payout.id] || payout.transaction_reference || ""}
                          onChange={(e) => setRefs((r) => ({ ...r, [payout.id]: e.target.value }))}
                          placeholder="Transaction/reference ID"
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <textarea
                          value={notes[payout.id] || payout.transaction_note || ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [payout.id]: e.target.value }))}
                          placeholder="Admin note"
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                        <select
                          value={payout.status}
                          disabled={busy === payout.id}
                          onChange={(e) => handleUpdateStatus(payout.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none disabled:opacity-50"
                        >
                          <option value="requested">Requested</option>
                          <option value="processing">Approve / Processing</option>
                          <option value="paid">Mark Paid</option>
                          <option value="rejected">Reject</option>
                        </select>
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
