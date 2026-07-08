import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { getPublicContactSettings, getPublicTreatments } from "@/lib/data/public";
import { site } from "@/lib/site";

export default async function Footer() {
  const [contactSettings, treatments] = await Promise.all([
    getPublicContactSettings(),
    getPublicTreatments(),
  ]);
  const footerText = "footerText" in contactSettings ? contactSettings.footerText : "";
  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/membership", label: "Membership" },
    { href: "/contact", label: "Contact" },
  ];
  const treatmentLinks = treatments.slice(0, 5).map((treatment) => ({
    href: `/treatments/${treatment.slug}`,
    label: treatment.kitName,
  }));

  return (
    <footer className="relative mt-8 overflow-hidden bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted text-white md:mt-10">
      <div className="container-x relative z-10 grid grid-cols-1 gap-x-6 gap-y-3 py-5 md:grid-cols-4 md:gap-8 md:py-10">
        <div>
          <Logo variant="light" size="footer" />
          <p className="mt-3 hidden max-w-xs text-xs leading-5 text-white/80 md:block">
            {footerText || "Premium Korean and Japanese-inspired skincare treatments with expert guidance and visible results."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:hidden">
          <MobileFooterLinks title="Quick Links" links={quickLinks} />
          <MobileFooterLinks title="Treatments" links={treatmentLinks} />
        </div>

        <FooterLinks title="Quick Links" links={quickLinks} />
        <FooterLinks title="Treatments" links={treatmentLinks} />

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white md:mb-3">Contact</h4>
          <div className="grid gap-1 text-xs leading-5 text-white/80 md:gap-1.5">
            <a href={`tel:${contactSettings.phoneRaw}`} className="font-semibold text-white hover:text-brand-light">
              {contactSettings.phone}
            </a>
            {contactSettings.email ? (
              <a href={`mailto:${contactSettings.email}`} className="hover:text-brand-light">
                {contactSettings.email}
              </a>
            ) : null}
            <p className="line-clamp-1 whitespace-pre-line text-xs leading-5 text-white/75 md:line-clamp-none">
              {contactSettings.address || site.address}
            </p>
            <p className="text-xs text-white/75">
              {(contactSettings as any).businessHours || site.businessHours} · {(contactSettings as any).weeklyOff || site.weeklyOff}
            </p>
          </div>

          <div className="mt-2.5 flex items-center gap-2.5 md:mt-4">
            <SocialLink href={contactSettings.whatsapp} label="Chat on WhatsApp">
              <MessageCircle size={17} aria-hidden="true" />
            </SocialLink>
            {contactSettings.instagram ? (
              <SocialLink href={contactSettings.instagram} label="Follow KIA Skin Care on Instagram">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </SocialLink>
            ) : null}
            {contactSettings.facebook ? (
              <SocialLink href={contactSettings.facebook} label="Follow KIA Skin Care on Facebook">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14 8h3V4.4c-.5-.1-2.2-.2-4.1-.2-4.1 0-6.9 2.5-6.9 7.1V15H2v4h4v10h5V19h4l.6-4H11v-3.3C11 10.5 11.3 8 14 8Z" transform="scale(.78) translate(3 -2)" />
                </svg>
              </SocialLink>
            ) : null}
            {contactSettings.email ? (
              <SocialLink href={`mailto:${contactSettings.email}`} label={`Email KIA Skin Care at ${contactSettings.email}`} external={false}>
                <Mail size={17} aria-hidden="true" />
              </SocialLink>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-1 py-3 text-center text-[11px] text-white/75 sm:flex-row sm:text-left md:gap-2 md:py-4">
          <p className="text-white/75">© 2026 KIA Skin Care. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div className="hidden md:block">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">{title}</h4>
      <ul className="space-y-2 text-xs text-white/80">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="line-clamp-1 hover:text-brand-light">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileFooterLinks({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <details className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
      <summary className="cursor-pointer list-none text-xs font-semibold text-white">{title}</summary>
      <ul className="mt-2 space-y-1.5 border-t border-white/10 pt-2 text-[11px] text-white/75">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="line-clamp-1 hover:text-brand-light">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function SocialLink({
  href,
  label,
  children,
  external = true,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
    >
      {children}
    </a>
  );
}
