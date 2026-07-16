"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCreatePayoutForPartner, getPayouts, updatePayoutStatus } from "@/lib/actions/payouts";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadPayouts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setPayouts(await getPayouts());
    if (showLoader) setLoading(false);
  }, []);

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  useEffect(() => {
    const refresh = () => void loadPayouts(false);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 25000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [loadPayouts]);

  async function handleUpdateStatus(id: string, status: string) {
    setBusy(id);
    try {
      await updatePayoutStatus(id, status, refs[id], notes[id]);
      await loadPayouts(false);
    } catch (error: any) {
      alert(error?.message || "Error updating payout status");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreatePayoutForPartner(payout: any) {
    const defaultAmount = Number(payout.available_balance || payout.partner_summary?.walletBalance || 0);
    const input = window.prompt(
      `Create a payout request for ${profileName(payout.partner?.profiles) !== "Unknown" ? profileName(payout.partner?.profiles) : payout.partner?.partner_code || "this partner"}.\n\nAmount to pay out (Rs.), max ${defaultAmount.toLocaleString("en-IN")}:`,
      String(defaultAmount)
    );
    if (input == null) return; // cancelled
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }

    setBusy(payout.id);
    try {
      const result = await adminCreatePayoutForPartner(payout.partner_id, amount);
      if (result.error) {
        alert(result.error);
      } else {
        await loadPayouts(false);
      }
    } catch (error: any) {
      alert(error?.message || "Unable to create payout for this partner.");
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
      case "available":
        return "bg-brand-light text-brand-primaryDark";
      case "settled":
        return "bg-emerald-50 text-emerald-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function money(value: number) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function profileName(value: any) {
    const profile = Array.isArray(value) ? value[0] : value;
    return profile?.full_name || "Unknown";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Payouts</h1>
        <p className="text-sm text-brand-muted">
          Approve, reject, and mark partner payout requests as paid. Net payable is paid after deducting the 15% admin/service fee from gross earnings.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1480px]">
            <thead className="bg-brand-surface/50 border-b border-brand-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Partner Name / ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Gross Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">15% Deduction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Net Payable</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Referral / Booking Breakup</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Wallet / Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Bank / UPI</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-brand-muted">Loading...</td></tr>
              ) : payouts.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-brand-muted">No payouts found</td></tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="align-top hover:bg-brand-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-brand-ink">{profileName(payout.partner?.profiles)}</p>
                      <p className="text-xs text-brand-muted font-mono">{payout.partner?.partner_code || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p className="font-semibold text-brand-ink">{money(payout.gross_amount || payout.amount)}</p>
                      <div className="mt-2 space-y-0.5 text-xs text-brand-muted">
                        <p>Membership: {money(payout.partner_summary?.membershipIncome)}</p>
                        <p>Referral bookings: {money(payout.partner_summary?.productIncome)}</p>
                        <p>Bonus: {money(payout.partner_summary?.bonusIncome)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-red-600">
                      <p className="font-semibold">-{money(payout.deduction_amount)}</p>
                      <p className="mt-1 text-xs text-red-700">15% fee deducted before payment</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p className="font-semibold text-brand-ink">{money(payout.net_amount || payout.amount)}</p>
                      <p className="mt-1 text-xs text-brand-muted">This is the amount partner receives.</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted min-w-[280px]">
                      {payout.partner_summary?.membershipSummary?.length || payout.partner_summary?.kitSummary?.length ? (
                        <div className="space-y-3">
                          {payout.partner_summary?.membershipSummary?.map((item: any) => (
                            <div key={`${item.membershipId}-${item.memberName}`} className="rounded-lg border border-brand-border bg-green-50/60 p-3">
                              <p className="font-semibold text-brand-ink">Referral Bonus Rs. 500</p>
                              <p className="mt-1">{item.memberName} | {item.membershipId}</p>
                              <p>{item.city}</p>
                              <p className="mt-1">Commission gross: {money(item.commissionAmount)}</p>
                              <p>Level {item.level} | {item.status}</p>
                            </div>
                          ))}
                          {payout.partner_summary.kitSummary.map((item: any) => (
                            <div key={item.kitName} className="rounded-lg border border-brand-border bg-brand-surface/40 p-3">
                              <p className="font-semibold text-brand-ink">{item.kitName}</p>
                              <p className="mt-1">Booking value: {money(item.sourceAmount)}</p>
                              <p>Commission gross: {money(item.commissionAmount)}</p>
                              <div className="mt-2 grid grid-cols-2 gap-1">
                                {[1, 2, 3, 4].map((level) => (
                                  <span key={level}>L{level}: {money(item.levels?.[level] || 0)}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No referral or booking commission yet.</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted">
                      <p>Wallet Balance: <span className="font-semibold text-brand-ink">{money(payout.available_balance ?? payout.partner_summary?.walletBalance)}</span></p>
                      <p>Paid Earnings: <span className="font-semibold text-brand-ink">{money(payout.partner?.paid_earnings ?? payout.partner_summary?.paidEarnings)}</span></p>
                      <p>Requested: {money(payout.partner_summary?.requestedPayout)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-brand-muted max-w-xs">
                      <p>{payout.payment_details || "-"}</p>
                      <p className="mt-1 text-xs">Method: {payout.payment_method || "-"}</p>
                      {payout.is_summary && (
                        <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                          Available for payout. No request yet.
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {payout.is_summary ? (
                        <div className="min-w-[240px] space-y-2">
                          <p className="rounded-lg border border-brand-border bg-brand-surface/50 px-3 py-2 text-xs text-brand-muted">
                            No payout request from this partner yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCreatePayoutForPartner(payout)}
                            disabled={busy === payout.id}
                            className="w-full rounded-lg bg-gradient-to-r from-brand-ink to-brand-muted px-3 py-2 text-xs font-medium text-white transition-all hover:shadow-glow disabled:opacity-50"
                          >
                            {busy === payout.id ? "Creating..." : "Create Payout for Partner"}
                          </button>
                        </div>
                      ) : (
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
                      )}
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
