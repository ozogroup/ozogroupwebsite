/**
 * Supabase public surface.
 *
 * Usage:
 *   - Client components:  getSupabaseBrowserClient()
 *   - Server components / route handlers: getSupabaseServerClient()
 *   - Privileged server tasks (service role): getSupabaseAdminClient()
 */

export { supabaseEnv } from "./env";
export { getSupabaseBrowserClient } from "./client";
export { getSupabaseServerClient } from "./server";
export type { Database, Json } from "./types";
