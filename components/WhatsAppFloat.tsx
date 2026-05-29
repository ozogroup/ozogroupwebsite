import { getPublicContactSettings } from "@/lib/data/public";

export default async function WhatsAppFloat() {
  const contactSettings = await getPublicContactSettings();
  return (
    <a
      href={contactSettings.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 group"
    >
      <span className="absolute inset-0 rounded-full bg-brand-primary/30 blur-lg animate-pulse" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-ink text-white shadow-card transition duration-200 group-hover:scale-105 group-hover:bg-brand-muted">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.52 3.48A11.9 11.9 0 0 0 12 .02C5.4.02.03 5.39.03 12c0 2.1.55 4.16 1.6 5.97L0 24l6.2-1.62a11.97 11.97 0 0 0 5.8 1.48h.01C18.6 23.86 24 18.49 24 11.88a11.82 11.82 0 0 0-3.48-8.4zM12 21.82h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.68.96.98-3.58-.23-.37A9.84 9.84 0 1 1 12 21.82zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.66-1.6-.9-2.19-.24-.58-.48-.5-.66-.51l-.56-.01c-.2 0-.51.07-.78.37-.27.3-1.03 1-1.03 2.43s1.06 2.83 1.2 3.03c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34z"/>
        </svg>
      </span>
      <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-brand-ink text-white text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition hidden sm:block">
        Chat with us
      </span>
    </a>
  );
}
