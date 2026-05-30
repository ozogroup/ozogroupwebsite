import Link from "next/link";
import Logo from "./Logo";
import { getPublicContactSettings } from "@/lib/data/public";
import { site } from "@/lib/site";

export default async function Footer() {
  const contactSettings = await getPublicContactSettings();
  const footerText = "footerText" in contactSettings ? contactSettings.footerText : "";
  return (
    <footer className="mt-20 bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted text-white relative overflow-hidden">
      <div className="container-x py-16 md:py-24 grid gap-12 md:grid-cols-12 relative z-10">
        <div className="md:col-span-5 space-y-6">
          <Logo variant="light" size="footer" />
          <p className="text-white/80 max-w-sm leading-relaxed">
            {footerText ||
              "KIA Skin Care offers advanced clinical treatments with visible, lasting results inspired by Korean and Japanese beauty traditions."}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={contactSettings.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-brand-card px-6 py-3.5 text-sm font-semibold text-brand-ink hover:bg-brand-light hover:shadow-glow transition-all"
            >
              <span>Chat on WhatsApp</span>
              <span aria-hidden>-&gt;</span>
            </a>
            {contactSettings.instagram ? (
              <a
                href={contactSettings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow KIA Skin Care on Instagram"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-white text-sm font-semibold tracking-wide uppercase mb-6">
            Quick Links
          </h4>
          <ul className="space-y-4 text-white/85 text-sm">
            <li><Link href="/" className="hover:text-brand-accent transition-colors">Home</Link></li>
            <li><Link href="/about" className="hover:text-brand-accent transition-colors">About</Link></li>
            <li><Link href="/treatments" className="hover:text-brand-accent transition-colors">Treatments</Link></li>
            <li><Link href="/referral" className="hover:text-brand-accent transition-colors">Membership</Link></li>
            <li><Link href="/contact" className="hover:text-brand-accent transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="text-white text-sm font-semibold tracking-wide uppercase mb-6">
            Contact
          </h4>
          <ul className="space-y-4 text-white/85 text-sm">
            <li>
              <span className="text-white/60">Customer Care:</span>{" "}
              <a href={`tel:${contactSettings.phoneRaw}`} className="font-semibold text-white hover:text-brand-accent transition-colors">
                {contactSettings.phone}
              </a>
            </li>
            {contactSettings.email ? (
              <li>
                <span className="text-white/60">Email:</span>{" "}
                <a href={`mailto:${contactSettings.email}`} className="font-medium text-white hover:text-brand-accent transition-colors">
                  {contactSettings.email}
                </a>
              </li>
            ) : null}
            <li>
              <span className="text-white/60">Address:</span>{" "}
              <span className="whitespace-pre-line">{contactSettings.address || site.address}</span>
            </li>
            <li>
              <span className="text-white/60">Office Time:</span>{" "}
              {(contactSettings as any).businessHours || site.businessHours}
            </li>
            <li>
              <span className="text-white/60">Weekly Off:</span>{" "}
              {(contactSettings as any).weeklyOff || site.weeklyOff}
            </li>
            {contactSettings.instagram ? (
              <li>
                <span className="text-white/60">Instagram:</span>{" "}
                <a
                  href={contactSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white hover:text-brand-accent transition-colors"
                >
                  Visit Instagram
                </a>
              </li>
            ) : null}
            <li>
              <span className="text-white/60">Brand:</span> {site.brand}
            </li>
            <li>
              <span className="text-white/60">Program:</span> {site.division}
            </li>
            <li className="text-white/70 italic">{site.tagline}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs [&_p]:text-white/90">
          <p>© 2026 KIA Skin Care. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a
              href={site.developer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-brand-light transition-colors"
            >
              {site.developer.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
