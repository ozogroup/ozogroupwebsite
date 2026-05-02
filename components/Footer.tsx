import Link from "next/link";
import Logo from "./Logo";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-ink text-white">
      <div className="container-x py-14 md:py-20 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5 space-y-5">
          <Logo variant="light" />
          <p className="text-white/85 max-w-sm">
            {site.brand} is a premium skincare division of {site.parent}, offering
            advanced clinical treatments with visible, lasting results.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold hover:bg-brand-light transition"
            >
              <span>Chat on WhatsApp</span>
              <span aria-hidden>→</span>
            </a>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow IA Skin Care on Instagram"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white hover:bg-white/10 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-white text-sm font-semibold tracking-wide uppercase mb-4">
            Explore
          </h4>
          <ul className="space-y-3 text-white/85 text-sm">
            <li><Link href="#treatments" className="hover:text-white">Treatments</Link></li>
            <li><Link href="#how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link href="#referrals" className="hover:text-white">Referral Program</Link></li>
            <li><Link href="#membership" className="hover:text-white">Membership</Link></li>
            <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
            <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="text-white text-sm font-semibold tracking-wide uppercase mb-4">
            Contact
          </h4>
          <ul className="space-y-3 text-white/85 text-sm">
            <li>
              <span className="text-white/65">Customer Care:</span>{" "}
              <a href={`tel:${site.phoneRaw}`} className="font-semibold text-white hover:text-brand-accent">
                {site.phone}
              </a>
            </li>
            <li>
              <span className="text-white/65">Instagram:</span>{" "}
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white hover:text-brand-accent"
              >
                @ia_korean_gloh_tretment
              </a>
            </li>
            <li>
              <span className="text-white/65">Brand:</span> {site.brand}
            </li>
            <li>
              <span className="text-white/65">Parent:</span> {site.parent}
            </li>
            <li className="text-white/75 italic">{site.tagline}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/75">
          <p>© {new Date().getFullYear()} {site.parent}. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a
              href={site.developer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-brand-accent"
            >
              {site.developer.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
