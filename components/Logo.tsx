"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  showDivision?: boolean;
  variant?: "light" | "dark";
};

const LOGO_SRC = "/logos/ozo-group-logo.png";

/**
 * Logo component
 * - Dynamic: attempts to render /public/logos/ozo-group-logo.png via
 *   next/image (optimised, responsive, aspect-preserving).
 * - Graceful fallback: if the image fails to load (file missing /
 *   network error), renders a styled text wordmark "OZO GROUP".
 * - The wordmark already contains "OZO GROUP" text, so the sub-label
 *   only shows "IA Skin Care Division" next to it.
 */
export default function Logo({ showDivision = true, variant = "dark" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const subColor = variant === "light" ? "text-white/75" : "text-brand-muted";
  const dividerColor = variant === "light" ? "bg-white/25" : "bg-brand-border";
  const wordmarkColor = variant === "light" ? "text-white" : "text-brand-ink";

  return (
    <Link
      href="/"
      className="flex items-center gap-3 group"
      aria-label="OZO Group — IA Skin Care"
    >
      {/* Primary: image wordmark (preserves aspect ratio, responsive) */}
      {!imgFailed ? (
        <span className="relative block h-8 md:h-10 w-[120px] md:w-[150px] shrink-0">
          <Image
            src={LOGO_SRC}
            alt="OZO Group"
            fill
            sizes="(max-width: 768px) 120px, 150px"
            className={`object-contain object-left ${
              variant === "light" ? "brightness-0 invert" : ""
            }`}
            priority
            onError={() => setImgFailed(true)}
          />
        </span>
      ) : (
        /* Fallback: styled text wordmark */
        <span className="flex items-center gap-2 shrink-0">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-white font-bold text-xs tracking-wider shadow-soft"
          >
            OZ
          </span>
          <span
            className={`font-display text-lg md:text-xl font-bold tracking-tight leading-none ${wordmarkColor}`}
          >
            OZO <span className="text-brand-accent">GROUP</span>
          </span>
        </span>
      )}

      {showDivision && (
        <span className="hidden sm:flex items-center gap-3">
          <span className={`h-6 w-px ${dividerColor}`} aria-hidden />
          <span
            className={`text-[11px] md:text-xs font-semibold tracking-[0.14em] uppercase ${subColor}`}
          >
            IA Skin Care
            <span className="block text-[10px] font-medium tracking-wide normal-case opacity-80">
              Division
            </span>
          </span>
        </span>
      )}
    </Link>
  );
}
