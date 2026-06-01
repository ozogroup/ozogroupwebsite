"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const statuses = ["new", "contacted", "interested", "converted", "rejected"];

type FranchiseLead = {
  id: string;
  full_name: string;
  mobile: string;
  city: string;
  current_business: string | null;
  investment_budget: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(value?: string | null) {
  return (value || "new").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminFranchiseLeadsPage() {
  const supabase = getSupabaseBrowserClient();
  const [leads, setLeads] = useState<FranchiseLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<FranchiseLead | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("franchise_leads" as any)
      .select("id,full_name,mobile,city,current_business,investment_budget,message,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading franchise leads:", error);
      setError("Unable to load franchise leads. Please confirm the franchise_leads table exists.");
      setLeads([]);
    } else {
      setLeads((data || []) as unknown as FranchiseLead[]);
    }
    setLoading(false);
  }

  async function updateLeadStatus(lead: FranchiseLead, status: string, note?: string) {
    setSavingId(lead.id);
    setError("");

    const payload: Record<string, string> = { status };
    if (note?.trim()) payload.admin_note = note.trim();

    let result = await (supabase as any).from("franchise_leads").update(payload).eq("id", lead.id);

    if (result.error && "admin_note" in payload) {
      result = await (supabase as any).from("franchise_leads").update({ status }).eq("id", lead.id);
    }

    if (result.error) {
      console.error("Error updating franchise lead:", result.error);
      setError("Unable to update franchise lead status.");
    } else {
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, status } : item))
      );
      setSelectedLead((current) => (current?.id === lead.id ? { ...current, status } : current));
      setToast("Franchise lead updated.");
      setTimeout(() => setToast(""), 2500);
      setAdminNote("");
    }

    setSavingId("");
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Franchise Leads" }]} />

      {toast && (
        <div className="fixed right-6 top-20 z-[100] rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Lead Capture</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-ink">Franchise Leads</h1>
          <p className="text-brand-muted">View and manage homepage franchise inquiry submissions.</p>
        </div>
        <button
          type="button"
          onClick={loadLeads}
          className="rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:border-brand-accent hover:text-brand-accent"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="border-b border-brand-border bg-brand-surface/50">
              <tr>
                {["Full Name", "Mobile Number", "City", "Current Business", "Investment Budget", "Message", "Status", "Created Date", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-brand-ink">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-brand-muted">Loading...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-brand-muted">No franchise leads yet.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-brand-surface/30">
                    <td className="px-4 py-3 font-medium text-brand-ink">{lead.full_name}</td>
                    <td className="px-4 py-3 text-sm text-brand-ink">{lead.mobile}</td>
                    <td className="px-4 py-3 text-sm text-brand-ink">{lead.city}</td>
                    <td className="px-4 py-3 text-sm text-brand-muted">{lead.current_business || "-"}</td>
                    <td className="px-4 py-3 text-sm text-brand-muted">{lead.investment_budget || "-"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-sm text-brand-muted">{lead.message || "-"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status || "new"}
                        onChange={(event) => updateLeadStatus(lead, event.target.value)}
                        disabled={savingId === lead.id}
                        className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLead(lead);
                          setAdminNote("");
                        }}
                        className="rounded-lg bg-brand-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-muted"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-premium">
            <div className="border-b border-brand-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Lead Details</p>
                  <h2 className="mt-1 text-xl font-bold text-brand-ink">{selectedLead.full_name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="rounded-lg px-3 py-1.5 text-sm text-brand-muted transition hover:bg-brand-surface hover:text-brand-ink"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Detail label="Mobile Number" value={selectedLead.mobile} />
              <Detail label="City" value={selectedLead.city} />
              <Detail label="Current Business" value={selectedLead.current_business || "-"} />
              <Detail label="Investment Budget" value={selectedLead.investment_budget || "-"} />
              <Detail label="Status" value={statusLabel(selectedLead.status)} />
              <Detail label="Created Date" value={formatDate(selectedLead.created_at)} />
              <div className="sm:col-span-2">
                <Detail label="Message" value={selectedLead.message || "-"} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-brand-ink">Admin Note</label>
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-brand-border bg-brand-surface/40 px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                  placeholder="Optional note. Saves when admin_note column exists."
                />
              </div>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <select
                  value={selectedLead.status || "new"}
                  onChange={(event) => setSelectedLead({ ...selectedLead, status: event.target.value })}
                  className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={savingId === selectedLead.id}
                  onClick={() => updateLeadStatus(selectedLead, selectedLead.status || "new", adminNote)}
                  className="rounded-xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-muted disabled:opacity-60"
                >
                  {savingId === selectedLead.id ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface/35 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-brand-ink">{value}</p>
    </div>
  );
}
