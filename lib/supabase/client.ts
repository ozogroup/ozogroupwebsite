"use client";

/**
 * Browser-side Supabase client.
 * Use in client components / hooks only. Uses the public anon key.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseEnv } from "./env";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  assertSupabaseEnv();
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey
  );
  return browserClient;
}
