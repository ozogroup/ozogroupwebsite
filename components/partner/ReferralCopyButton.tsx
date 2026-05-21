"use client";

import { useState } from "react";

export default function ReferralCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-5 py-2.5 bg-white text-brand-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
    >
      {copied ? "Copied" : "Copy Link"}
    </button>
  );
}
