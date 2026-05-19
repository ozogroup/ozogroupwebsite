/**
 * Supabase environment configuration.
 * Validates required env vars and exposes typed config.
 */

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = rawUrl ? rawUrl.replace(/\/+$/, "") : undefined;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseEnv = {
  url: SUPABASE_URL ?? "",
  anonKey: SUPABASE_ANON_KEY ?? "",
  serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY ?? "",
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
};

export function assertSupabaseEnv() {
  if (!supabaseEnv.url || !supabaseEnv.anonKey) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment."
    );
  }
}

export function logSupabaseConfig() {
  console.log("[Supabase] URL configured:", !!supabaseEnv.url);
  console.log("[Supabase] Anon key configured:", !!supabaseEnv.anonKey);
  console.log("[Supabase] Service role configured:", !!supabaseEnv.serviceRoleKey);
}

export function assertSupabaseServiceRole() {
  if (!supabaseEnv.serviceRoleKey) {
    throw new Error(
      "[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY (server-only) in environment."
    );
  }
}
