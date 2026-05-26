"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackReferralClick } from "@/lib/actions/referral-clicks";

export const REFERRAL_STORAGE_KEY = "kia_referral_code";
export const LEGACY_REFERRAL_STORAGE_KEY = "ozo_referral_code";

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref")?.trim();
    if (ref) {
      const code = ref.toUpperCase();
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
      const deviceType = window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
      void trackReferralClick(code, deviceType);
    }
  }, [searchParams]);

  return null;
}
