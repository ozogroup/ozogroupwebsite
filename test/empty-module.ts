// Stand-in for the "server-only" package under Vitest. Next.js replaces
// "server-only" with a no-op at build time via webpack; outside that build
// pipeline (i.e. under Vitest) importing it directly throws by design, so
// vitest.config.ts aliases it to this empty module instead.
export {};
