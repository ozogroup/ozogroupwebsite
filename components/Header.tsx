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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-brand-border/60 shadow-soft"
          : "bg-white/70 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 md:h-20 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-sm font-medium text-brand-ink hover:text-brand-accent transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-brand-accent after:transition-all hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="#login" className="btn-ghost">
            Partner Login
          </Link>
          <button
            type="button"
            onClick={() => openBooking()}
            className="btn-primary shadow-soft hover:shadow-card transition-shadow"
          >
            Book Consultation
          </button>
        </div>

        {/* Mobile compact CTAs */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            type="button"
            onClick={() => openBooking()}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-primary to-brand-accent text-white px-4 py-2.5 text-xs font-semibold shadow-soft hover:shadow-card transition-all"
          >
            Book Now
          </button>
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-border/60 bg-white text-brand-ink hover:bg-brand-surface transition-colors"
          >
          <span className="sr-only">Menu</span>
          <div className="relative h-5 w-6">
            <span
              className={`absolute left-0 top-0 h-0.5 w-6 bg-current transition-all duration-300 ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-6 bg-current transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 h-0.5 w-6 bg-current transition-all duration-300 ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
          </button>
        </div>
      </div>

      {/* Mobile drawer (right sidebar) */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition duration-300 ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-brand-ink/50 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-premium border-l border-brand-border/60 transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 md:h-20 items-center justify-between px-6 border-b border-brand-border/60">
            <Logo />
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="h-10 w-10 rounded-xl border border-brand-border/60 bg-white text-brand-ink hover:bg-brand-surface transition-colors flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-2">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3.5 text-base font-medium text-brand-ink hover:bg-brand-surface hover:text-brand-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openBooking();
                }}
                className="btn-primary w-full justify-center shadow-soft hover:shadow-card transition-shadow"
              >
                Book Consultation
              </button>
              <Link
                href="#login"
                onClick={() => setOpen(false)}
                className="btn-secondary w-full justify-center"
              >
                Partner Login
              </Link>
            </div>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 text-sm text-brand-muted flex items-center gap-2 hover:text-brand-accent transition-colors"
            >
              Need help? <span className="text-brand-accent font-medium">Chat on WhatsApp →</span>
            </a>
          </nav>
        </aside>
      </div>
    </header>
  );
}
