"use client";

import { useState } from "react";

export default function ReferralShareCard({
  partnerCode,
  referralLink,
}: {
  partnerCode: string;
  referralLink: string;
}) {
  const [copied, setCopied] = useState(false);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(referralLink)}`;
  const shareText = `Join KIA Skin Care under my Partner ID: ${partnerCode}\n\n${referralLink}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramLink = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join KIA Skin Care under my Partner ID: ${partnerCode}`)}`;

  async function copyReferralLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-premium">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#4F4542] via-[#5B4C46] to-[#6F625C] p-6 text-white md:p-8">
          <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-surface/20 blur-3xl" />
          <div aria-hidden className="absolute bottom-4 left-6 h-32 w-32 rounded-full bg-brand-accent/20 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-surface">
              Referral Link Card
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white md:text-3xl">Your KIA Referral Link</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
              Share this clean link with prospects so they can register directly under your network.
            </p>

            <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.12] p-4 backdrop-blur">
              <p className="break-all font-mono text-sm text-white md:text-base">{referralLink}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={copyReferralLink}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-ink shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-surface"
              >
                {copied ? "Copied" : "Copy Link"}
              </button>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-5 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#20BD5A]"
              >
                WhatsApp Share
              </a>
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-brand-surface/40 bg-brand-surface/15 px-5 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-surface/25"
              >
                Telegram Share
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-brand-surface/70 p-6 md:p-8">
          <div className="mx-auto max-w-xs rounded-[1.5rem] border border-brand-border bg-white p-5 text-center shadow-soft">
            <div className="rounded-2xl bg-brand-surface/60 p-4">
              <img src={qrCodeUrl} alt={`Referral QR code for ${partnerCode}`} className="mx-auto h-52 w-52 rounded-xl bg-white" />
            </div>
            <p className="mt-5 text-sm font-medium text-brand-ink">
              Scan this code to quickly register under your network.
            </p>
            <p className="mt-2 text-xs text-brand-muted">Partner ID: {partnerCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
