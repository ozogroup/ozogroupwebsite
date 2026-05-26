"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  showDivision?: boolean;
  variant?: "light" | "dark";
};

const LOGO_SRC = "/logos/kia-skin-care-logo.png";

export default function Logo({ variant = "dark" }: Props) {
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
          className={`relative block h-11 w-[82px] shrink-0 md:h-14 md:w-[104px] ${
            variant === "light" ? "rounded-xl bg-white px-2 py-1.5 shadow-sm" : ""
          }`}
        >
          <Image
            src={LOGO_SRC}
            alt="KIA Skin Care"
            fill
            sizes="(max-width: 768px) 82px, 104px"
            className="object-contain"
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
