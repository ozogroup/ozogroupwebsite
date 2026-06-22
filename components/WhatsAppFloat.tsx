import { getPublicContactSettings } from "@/lib/data/public";

export default async function WhatsAppFloat() {
  const contactSettings = await getPublicContactSettings();
  return (
    <div className="fixed right-6 bottom-8 z-[9999] flex flex-col items-center gap-4">
      {contactSettings.facebook ? (
        <a
          href={contactSettings.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Facebook"
          className="group"
        >
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-card transition duration-200 group-hover:scale-105">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
            </svg>
          </span>
        </a>
      ) : null}
      {contactSettings.instagram ? (
        <a
          href={contactSettings.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="group"
        >
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white shadow-card transition duration-200 group-hover:scale-105">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.5.01-4.74.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.59-.07-4.74-.07zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92zm0 9.01a3.55 3.55 0 1 0 0-7.1 3.55 3.55 0 0 0 0 7.1zm6.95-9.23a1.28 1.28 0 1 1-2.56 0 1.28 1.28 0 0 1 2.56 0z"/>
            </svg>
          </span>
        </a>
      ) : null}
      <a
        href={contactSettings.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366]/30 blur-lg animate-pulse" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-card transition duration-200 group-hover:scale-105 group-hover:bg-[#20BD5A]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.9 11.9 0 0 0 12 .02C5.4.02.03 5.39.03 12c0 2.1.55 4.16 1.6 5.97L0 24l6.2-1.62a11.97 11.97 0 0 0 5.8 1.48h.01C18.6 23.86 24 18.49 24 11.88a11.82 11.82 0 0 0-3.48-8.4zM12 21.82h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.68.96.98-3.58-.23-.37A9.84 9.84 0 1 1 12 21.82zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.66-1.6-.9-2.19-.24-.58-.48-.5-.66-.51l-.56-.01c-.2 0-.51.07-.78.37-.27.3-1.03 1-1.03 2.43s1.06 2.83 1.2 3.03c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.34z"/>
          </svg>
        </span>
        <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-brand-ink text-white text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition hidden sm:block">
          Chat with us
        </span>
      </a>
    </div>
  );
}
