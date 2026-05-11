import { AlertTriangle, Database } from "lucide-react";

interface SetupRequiredProps {
  module: string;
  table: string;
  description: string;
  errorMessage?: string;
}

export default function SetupRequired({ module, table, description, errorMessage }: SetupRequiredProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-amber-900">Setup Required: {module}</h2>
          <p className="text-sm text-amber-800 mt-1">{description}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-900 bg-amber-100/60 border border-amber-200 rounded-lg px-3 py-2">
            <Database className="w-4 h-4" />
            <span>
              Required Supabase table: <code className="font-mono font-semibold">{table}</code>
            </span>
          </div>
          {errorMessage && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-100/60 border border-amber-200 rounded-lg px-3 py-2 font-mono">
              {errorMessage}
            </div>
          )}
          <p className="text-xs text-amber-700 mt-4">
            Run the appropriate SQL migration in Supabase SQL Editor, then refresh this page.
          </p>
        </div>
      </div>
    </div>
  );
}
