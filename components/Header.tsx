"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { site } from "@/lib/site";
import { useBooking } from "./booking/BookingContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { open: openBooking } = useBooking();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-brand-border shadow-soft"
          : "bg-white/70 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 md:h-20 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-sm font-medium text-brand-ink hover:text-brand-accent transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="#login" className="btn-ghost">
            Login
          </Link>
          <button
            type="button"
            onClick={() => openBooking()}
            className="btn-primary"
          >
            Book Now
          </button>
        </div>

        {/* Mobile compact CTAs */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => openBooking()}
            className="inline-flex items-center rounded-full bg-brand-primary text-white px-3.5 py-2 text-xs font-semibold shadow-soft hover:bg-brand-accent transition"
          >
            Book Now
          </button>
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-ink"
          >
          <span className="sr-only">Menu</span>
          <div className="relative h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-5 bg-current transition ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 h-0.5 w-5 bg-current transition ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </div>
          </button>
        </div>
      </div>

      {/* Mobile drawer (right sidebar) */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-brand-ink/40 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[82%] max-w-sm bg-white shadow-card border-l border-brand-border transition-transform ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-5 border-b border-brand-border">
            <Logo />
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="h-9 w-9 rounded-lg border border-brand-border text-brand-ink"
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col p-5 gap-1">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-brand-ink hover:bg-brand-surface hover:text-brand-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openBooking();
                }}
                className="btn-primary w-full justify-center"
              >
                Book Now
              </button>
              <Link
                href="#login"
                onClick={() => setOpen(false)}
                className="btn-secondary w-full justify-center"
              >
                Login
              </Link>
            </div>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 text-sm text-brand-muted"
            >
              Need help? <span className="text-brand-accent font-medium">Chat on WhatsApp →</span>
            </a>
          </nav>
        </aside>
      </div>
    </header>
  );
}
