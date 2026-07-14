"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";

export default function LogoutButton({
  inverse = false,
  redirectTo = "/admin/login",
}: {
  inverse?: boolean;
  redirectTo?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    setLoading(true);
    await logoutAction(redirectTo);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
        inverse ? "text-white/90 hover:bg-white/10 hover:text-white" : "text-brand-ink hover:bg-brand-surface"
      }`}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )}
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
