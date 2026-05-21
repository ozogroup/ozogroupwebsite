"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  showDivision?: boolean;
  variant?: "light" | "dark";
};

const LOGO_SRC = "/logos/ozo-service-logo.png";

export default function Logo({ showDivision = true, variant = "dark" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const subColor = variant === "light" ? "text-white/75" : "text-brand-muted";
  const dividerColor = variant === "light" ? "bg-white/25" : "bg-brand-border";
  const wordmarkColor = variant === "light" ? "text-white" : "text-brand-ink";

  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-3"
      aria-label="OZO Service - IA Skin Care"
    >
      {!imgFailed ? (
        <span
          className={`relative block h-9 w-[144px] shrink-0 md:h-10 md:w-[160px] ${
            variant === "light" ? "rounded-lg bg-white/95 px-2 py-1 shadow-sm" : ""
          }`}
        >
          <Image
            src={LOGO_SRC}
            alt="OZO Service"
            fill
            sizes="(max-width: 768px) 144px, 160px"
            className="object-contain object-left"
            priority
            onError={() => setImgFailed(true)}
          />
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-bold tracking-wider text-white shadow-soft md:h-9 md:w-9"
          >
            OZ
          </span>
          <span
            className={`font-display text-lg font-bold leading-none tracking-tight md:text-xl ${wordmarkColor}`}
          >
            OZO <span className="text-brand-accent">Service</span>
          </span>
        </span>
      )}

      {showDivision && (
        <span className="hidden items-center gap-3 sm:flex">
          <span className={`h-6 w-px ${dividerColor}`} aria-hidden />
          <span
            className={`text-[11px] font-semibold uppercase tracking-[0.14em] md:text-xs ${subColor}`}
          >
            IA Skin Care
            <span className="block text-[10px] font-medium normal-case tracking-wide opacity-80">
              Division
            </span>
          </span>
        </span>
      )}
    </Link>
  );
}
