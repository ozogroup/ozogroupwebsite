"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DirectSelectTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function testDirectSelect() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await (supabase as any).from("treatments").select("id,title,slug,treatment_type,active").limit(5);
      
      if (error) {
        setError(`Error: ${error.message} (code: ${error.code})`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white">Direct Select Test</h2>
        <button
          onClick={testDirectSelect}
          disabled={loading}
          className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-accent disabled:opacity-50"
        >
          {loading ? "Running..." : "Test Direct Select"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded p-3">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-800 rounded p-3 max-h-96 overflow-auto">
          <p className="text-green-400 mb-2">Result ({result.length} rows):</p>
          <pre className="text-gray-300 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
