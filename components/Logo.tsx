"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  showDivision?: boolean;
  variant?: "light" | "dark";
  size?: "compact" | "default" | "auth" | "footer";
};

const LOGO_SRC = "/logos/kia-skin-care-logo.png";

const logoSizes = {
  compact: "h-12 w-[98px] p-2",
  default: "h-14 w-[112px] p-2 md:h-[68px] md:w-[136px] md:p-2.5",
  auth: "h-[76px] w-[146px] p-3 sm:h-[84px] sm:w-[164px]",
  footer: "h-[82px] w-[162px] p-3 md:h-[96px] md:w-[192px] md:p-3.5",
};

export default function Logo({ variant = "dark", size = "default" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const wordmarkColor = variant === "light" ? "text-white" : "text-brand-ink";

  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center"
      aria-label="KIA Skin Care"
    >
      {!imgFailed ? (
        <span
          className={`block shrink-0 overflow-hidden rounded-xl border border-brand-border/65 bg-brand-card shadow-soft ${logoSizes[size]}`}
        >
          <span className="relative block h-full w-full">
            <Image
              src={LOGO_SRC}
              alt="KIA Skin Care"
              fill
              sizes={size === "footer" ? "(max-width: 768px) 162px, 192px" : size === "auth" ? "(max-width: 640px) 146px, 164px" : size === "compact" ? "98px" : "(max-width: 768px) 112px, 136px"}
              className="object-contain"
              priority
              onError={() => setImgFailed(true)}
            />
          </span>
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-xs font-bold tracking-wider text-white shadow-soft md:h-9 md:w-9"
          >
            KIA
          </span>
          <span
            className={`font-display text-lg font-bold leading-none tracking-tight md:text-xl ${wordmarkColor}`}
          >
            KIA <span className="text-brand-accent">Skin Care</span>
          </span>
        </span>
      )}
    </Link>
  );
}
