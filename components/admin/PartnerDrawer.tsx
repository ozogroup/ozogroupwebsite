"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ShieldCheck, CreditCard, Wallet, User, FileText } from "lucide-react";
import PartnerAccessPanel from "./PartnerAccessPanel";

interface PartnerDrawerProps {
  partnerId: string | null;
  onClose: () => void;
}

export default function PartnerDrawer({ partnerId, onClose }: PartnerDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partner-detail?id=${encodeURIComponent(id)}`);
      if (res.ok) setData(await res.json());
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (partnerId) {
      setData(null);
      void load(partnerId);
    }
  }, [partnerId, load]);

  useEffect(() => {
    if (!partnerId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [partnerId, onClose]);

  if (!partnerId) return null;

  const kycColor = (s: string) =>
    ["verified", "approved"].includes(s) ? "bg-emerald-100 text-emerald-700" :
    ["pending", "under_review"].includes(s) ? "bg-yellow-100 text-yellow-700" :
    s === "rejected" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl sm:max-w-lg">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="text-lg font-semibold text-brand-ink">Partner Details</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-muted hover:bg-brand-surface hover:text-brand-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-brand-accent border-t-transparent" />
            </div>
          )}

          {data && !loading && (
            <>
              {/* Profile */}
              <section className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
                    <User className="h-5 w-5 text-brand-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-ink">{data.name}</p>
                    <p className="font-mono text-xs font-bold text-brand-primaryDark">{data.partner_code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Detail label="Phone" value={data.phone} />
                  <Detail label="Email" value={data.email} />
                  <Detail label="City" value={data.city} />
                  <Detail label="Status" value={data.status} />
                  <Detail label="Joined" value={data.joined} />
                  <Detail label="Sponsor" value={data.sponsor_code} />
                </div>
              </section>

              {/* KYC Status */}
              <section className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-brand-accent" />
                  <h3 className="text-sm font-semibold text-brand-ink">KYC Verification</h3>
                </div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${kycColor(data.kyc_status)}`}>
                  {(data.kyc_status || "not_submitted").replace(/_/g, " ")}
                </span>
                {data.documents && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {data.documents.map((doc: any) => (
                      <a
                        key={doc.type}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-brand-border p-2 text-xs hover:border-brand-accent hover:bg-brand-surface/50 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-brand-muted" />
                        <span className="font-medium text-brand-ink capitalize">{doc.type.replace(/_/g, " ")}</span>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {/* Payment Method */}
              <section className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-brand-accent" />
                  <h3 className="text-sm font-semibold text-brand-ink">Payment Method</h3>
                </div>
                {data.payment_method === "upi" ? (
                  <div className="space-y-1 text-sm">
                    <Detail label="Method" value="UPI" />
                    <Detail label="UPI ID" value={data.upi_id} />
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <Detail label="Method" value="Bank Transfer" />
                    <Detail label="Holder" value={data.bank_holder} />
                    <Detail label="Account" value={data.bank_account} />
                    <Detail label="IFSC" value={data.bank_ifsc} />
                    <Detail label="Bank" value={data.bank_name} />
                    {data.bank_branch && <Detail label="Branch" value={data.bank_branch} />}
                  </div>
                )}
              </section>

              {/* Wallet & Income */}
              <section className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-brand-accent" />
                  <h3 className="text-sm font-semibold text-brand-ink">Wallet & Income</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetricBox label="Wallet Balance" value={`Rs. ${Number(data.wallet_balance || 0).toLocaleString("en-IN")}`} />
                  <MetricBox label="Total Earnings" value={`Rs. ${Number(data.total_earnings || 0).toLocaleString("en-IN")}`} />
                  <MetricBox label="Paid Out" value={`Rs. ${Number(data.paid_earnings || 0).toLocaleString("en-IN")}`} />
                  <MetricBox label="Pending Payouts" value={`Rs. ${Number(data.pending_payouts || 0).toLocaleString("en-IN")}`} />
                </div>
                {data.income_breakdown && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-brand-muted uppercase">Income Breakdown</p>
                    {data.income_breakdown.map((item: any) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-brand-muted">{item.label}</span>
                        <span className="font-semibold text-brand-ink">Rs. {Number(item.amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Payouts */}
              {data.recent_payouts && data.recent_payouts.length > 0 && (
                <section className="rounded-xl border border-brand-border p-4">
                  <h3 className="text-sm font-semibold text-brand-ink mb-3">Recent Payouts</h3>
                  <div className="space-y-2">
                    {data.recent_payouts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg bg-brand-surface/40 p-3 text-sm">
                        <div>
                          {p.kia_payout_id && <p className="font-mono text-[10px] font-semibold text-emerald-700">{p.kia_payout_id}</p>}
                          <p className="text-xs text-brand-muted">{p.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-brand-ink">Rs. {Number(p.net || 0).toLocaleString("en-IN")}</p>
                          <span className={`text-[10px] font-medium capitalize ${p.status === "paid" ? "text-emerald-700" : "text-yellow-700"}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Login Access Management */}
              <PartnerAccessPanel partnerId={partnerId!} />
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-brand-muted uppercase">{label}</p>
      <p className="font-medium text-brand-ink">{value || "—"}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-surface/50 p-3 text-center">
      <p className="text-[10px] text-brand-muted uppercase">{label}</p>
      <p className="mt-1 font-semibold text-brand-ink">{value}</p>
    </div>
  );
}
