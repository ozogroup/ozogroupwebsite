"use client";

import { useState } from "react";
import { runReconciliationAudit, runFullReconciliation } from "@/lib/actions/reconciliation";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { AlertTriangle, CheckCircle2, RefreshCw, Shield, Database, FileSearch, Play } from "lucide-react";

type Report = Awaited<ReturnType<typeof runFullReconciliation>>;

export default function ReconciliationPage() {
  const [phase, setPhase] = useState<"idle" | "auditing" | "audit_done" | "repairing" | "done">("idle");
  const [auditReport, setAuditReport] = useState<Report | null>(null);
  const [repairReport, setRepairReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAudit() {
    setPhase("auditing");
    setError(null);
    try {
      const report = await runReconciliationAudit() as any;
      setAuditReport(report);
      setPhase("audit_done");
    } catch (e: any) {
      setError(e?.message || "Audit failed");
      setPhase("idle");
    }
  }

  async function handleRepair() {
    setPhase("repairing");
    setError(null);
    try {
      const report = await runFullReconciliation();
      setRepairReport(report);
      setPhase("done");
    } catch (e: any) {
      setError(e?.message || "Repair failed");
      setPhase("audit_done");
    }
  }

  const report = repairReport || auditReport;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Reconciliation" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">Audit and repair financial data + KYC document references</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleAudit}
          disabled={phase === "auditing" || phase === "repairing"}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileSearch className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">
              {phase === "auditing" ? "Scanning..." : "1. Audit"}
            </p>
            <p className="text-xs text-gray-500">Scan for discrepancies (read-only)</p>
          </div>
          {phase === "auditing" && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin ml-auto" />}
        </button>

        <button
          onClick={handleRepair}
          disabled={phase !== "audit_done"}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${phase === "audit_done" ? "bg-amber-50" : "bg-gray-50"}`}>
            <Play className={`w-5 h-5 ${phase === "audit_done" ? "text-amber-600" : "text-gray-400"}`} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">
              {phase === "repairing" ? "Repairing..." : "2. Repair All"}
            </p>
            <p className="text-xs text-gray-500">Fix wallets + recover KYC docs</p>
          </div>
          {phase === "repairing" && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin ml-auto" />}
        </button>

        <div className={`flex items-center gap-3 p-4 rounded-xl border ${phase === "done" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${phase === "done" ? "bg-green-100" : "bg-gray-100"}`}>
            {phase === "done" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Shield className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="text-left">
            <p className={`font-semibold ${phase === "done" ? "text-green-800" : "text-gray-400"}`}>3. Done</p>
            <p className={`text-xs ${phase === "done" ? "text-green-600" : "text-gray-400"}`}>
              {phase === "done" ? "All repairs applied" : "Awaiting repair"}
            </p>
          </div>
        </div>
      </div>

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard label="Partners Scanned" value={report.summary.partnersScanned} />
            <SummaryCard label="Wallet Issues" value={report.summary.walletDiscrepancies} alert={report.summary.walletDiscrepancies > 0} />
            <SummaryCard label="Paid Earnings Issues" value={report.summary.paidEarningsDiscrepancies} alert={report.summary.paidEarningsDiscrepancies > 0} />
            <SummaryCard label="KYC Docs Recovered" value={report.summary.kycDocumentsRecovered} good={report.summary.kycDocumentsRecovered > 0} />
            <SummaryCard label="KYC Docs Missing" value={report.summary.kycDocumentsMissing} alert={report.summary.kycDocumentsMissing > 0} />
          </div>

          {/* Wallet repairs */}
          {report.walletRepairs.length > 0 && (
            <ReportSection
              title="Wallet Balance Repairs"
              icon={<Database className="w-4 h-4" />}
              items={report.walletRepairs.map((r) => ({
                partner: `${r.partnerName} (${r.partnerCode})`,
                detail: `${r.field}: ${r.before} → ${r.after}`,
                reason: r.reason,
              }))}
              done={phase === "done"}
            />
          )}

          {/* Paid earnings repairs */}
          {report.paidEarningsRepairs.length > 0 && (
            <ReportSection
              title="Paid Earnings Repairs"
              icon={<Database className="w-4 h-4" />}
              items={report.paidEarningsRepairs.map((r) => ({
                partner: `${r.partnerName} (${r.partnerCode})`,
                detail: `${r.field}: ${r.before} → ${r.after}`,
                reason: r.reason,
              }))}
              done={phase === "done"}
            />
          )}

          {/* KYC document recoveries */}
          {report.kycRecoveries.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-sm text-gray-800">KYC Document Recovery</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                      <th className="px-3 py-2 text-left">Partner</th>
                      <th className="px-3 py-2 text-left">Document</th>
                      <th className="px-3 py-2 text-left">Path</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.kycRecoveries.map((r, i) => (
                      <tr key={i} className={r.recovered ? "bg-green-50/30" : "bg-red-50/30"}>
                        <td className="px-3 py-2 font-medium text-gray-800">{r.partnerName} ({r.partnerCode})</td>
                        <td className="px-3 py-2 text-gray-600">{r.documentType}</td>
                        <td className="px-3 py-2 text-gray-500 font-mono text-[10px] max-w-[200px] truncate">{r.storagePath || "-"}</td>
                        <td className="px-3 py-2 text-center">
                          {r.recovered ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Recovered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full" title={r.error}>
                              <AlertTriangle className="w-3 h-3" /> Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No issues */}
          {report.walletRepairs.length === 0 && report.paidEarningsRepairs.length === 0 && report.kycRecoveries.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-800">All data is consistent</p>
              <p className="text-sm text-green-600 mt-1">No discrepancies found. Wallets, payouts, and KYC documents are all in sync.</p>
            </div>
          )}

          {/* Errors */}
          {report.summary.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-800 mb-2">Errors during repair</p>
              <ul className="space-y-1">
                {report.summary.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600">• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-gray-400 text-right">
            Report generated: {new Date(report.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, alert, good }: { label: string; value: number; alert?: boolean; good?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? "bg-red-50 border-red-200" : good ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
      <p className={`text-2xl font-bold ${alert ? "text-red-700" : good ? "text-green-700" : "text-gray-900"}`}>{value}</p>
      <p className={`text-[10px] uppercase tracking-wide ${alert ? "text-red-500" : good ? "text-green-500" : "text-gray-500"}`}>{label}</p>
    </div>
  );
}

function ReportSection({ title, icon, items, done }: { title: string; icon: React.ReactNode; items: { partner: string; detail: string; reason: string }[]; done: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
        <span className="ml-auto text-xs text-gray-400">{items.length} items</span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i} className={`px-4 py-3 ${done ? "bg-green-50/30" : "bg-amber-50/30"}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm text-gray-800">{item.partner}</p>
              {done && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-xs text-gray-600 font-mono mt-0.5">{item.detail}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
