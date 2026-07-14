"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefreshRoute({ intervalMs = 25000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, intervalMs);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, [intervalMs, router]);

  return null;
}
