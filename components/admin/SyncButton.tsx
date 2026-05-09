"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { syncWebsiteData } from "@/lib/actions/sync";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSync() {
    if (loading) return;
    if (!confirm("Sync website data into Supabase? This will import treatments, testimonials, FAQs and contact info that don't exist yet.")) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await syncWebsiteData();
      const total = result.treatments + result.testimonials + result.faqs + result.contact;
      if (result.errors.length > 0) {
        setMessage({
          type: "error",
          text: `Synced ${total} items. Errors: ${result.errors.join("; ")}`,
        });
      } else if (total === 0) {
        setMessage({ type: "success", text: "Already up to date — no new data to import." });
      } else {
        setMessage({
          type: "success",
          text: `Imported ${result.treatments} treatments, ${result.testimonials} testimonials, ${result.faqs} FAQs, ${result.contact} contact settings.`,
        });
        router.refresh();
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Sync failed" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 8000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-60"
      >
        <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? "Syncing..." : "Sync Website Data"}
      </button>
      {message && (
        <div
          className={`text-xs px-3 py-2 rounded-lg max-w-md text-right ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
