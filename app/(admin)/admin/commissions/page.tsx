"use client";

import { useCallback, useEffect, useState } from "react";
import { generateMissingBookingCommissions, getCommissions, updateCommissionStatus } from "@/lib/actions/commissions";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCommissions = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const data = await getCommissions();
    setCommissions(data);
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    void loadCommissions();
  }, [loadCommissions]);

  useEffect(() => {
    const refresh = () => void loadCommissions(false);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 25000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [loadCommissions]);

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await updateCommissionStatus(id, status);
      await loadCommissions(false);
    } catch (error: any) {
      console.error("Error updating commission status:", error);
      alert(error?.message || "Error updating commission status");
    }
  }

  async function handleGenerateMissing() {
    setGenerating(true);
    setMessage(null);
    try {
      const result = await generateMissingBookingCommissions();
      await loadCommissions(false);
      setMessage(`Checked ${result.scanned} eligible bookings and generated any missing 4-level commission rows.`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to generate missing commissions.");
    } finally {
      setGenerating(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-brand-light text-brand-primaryDark";
      case "paid":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function allowedStatuses(status: string) {
    if (status === "pending") return ["pending", "approved", "rejected"];
    if (status === "approved") return ["approved", "rejected"];
    return [status];
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">Commissions</h1>
          <p className="text-sm text-brand-muted">Trace partner commissions from booking source to payout status.</p>
        </div>
        <button
          type="button"
          onClick={handleGenerateMissing}
          disabled={generating}
          className="rounded-lg bg-gradient-to-r from-brand-ink to-brand-muted px-4 py-2.5 text-sm font-medium text-white transition-all hover:shadow-glow disabled:opacity-60"
        >
          {generating ? "Checking..." : "Generate Missing Booking Commissions"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted shadow-sm">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Source Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-brand-muted">
                    No commissions found
                  </td>
                </tr>
              ) : (
                commissions.map((commission) => (
                  <tr key={commission.id} className="transition-colors hover:bg-brand-surface/30">
                    <td className="px-4 py-4 font-medium text-brand-ink sm:px-6">
                      <p>{commission.partner?.profiles?.full_name || "Unknown"}</p>
                      <p className="mt-1 font-mono text-xs text-brand-muted">{commission.partner?.partner_code || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      {commission.source_type === "booking" && commission.source_booking ? (
                        <div>
                          <p className="font-medium text-brand-ink">{commission.source_booking.booking_id || commission.source_id}</p>
                          <p>{commission.source_booking.customer_name || "-"} | {commission.source_booking.treatment_name || "-"}</p>
                          <p className="font-mono text-xs">{commission.source_booking.treatment_order_id || "-"}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="capitalize">{commission.source_type || "unknown"}</p>
                          <p className="font-mono text-xs">{commission.source_id || "-"}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{commission.level}</td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">{Number(commission.percentage || 0)}%</td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      Rs. {Number(commission.source_amount || commission.source_booking?.payment_amount || commission.source_booking?.treatment_price || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      Rs. {Number(commission.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted sm:px-6">
                      <p>Created: {commission.created_at ? new Date(commission.created_at).toLocaleDateString("en-IN") : "-"}</p>
                      <p>Paid: {commission.paid_at ? new Date(commission.paid_at).toLocaleDateString("en-IN") : "-"}</p>
                      <p className="font-mono text-xs">Payout: {commission.payout_id || "-"}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <select
                        value={commission.status}
                        onChange={(event) => handleUpdateStatus(commission.id, event.target.value)}
                        className="rounded border border-brand-border px-2 py-1.5 text-xs outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent"
                      >
                        {allowedStatuses(commission.status).map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
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
