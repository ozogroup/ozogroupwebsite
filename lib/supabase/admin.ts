import "server-only";

/**
 * Admin Supabase client using the service role key.
 * NEVER import this from client components. Server-side only.
 * Bypasses RLS — use carefully (admin tasks, webhooks, secure server actions).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertSupabaseEnv,
  assertSupabaseServiceRole,
  supabaseEnv,
} from "./env";
import type { Database } from "./types";

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  assertSupabaseEnv();
  assertSupabaseServiceRole();
  if (adminClient) return adminClient;
  adminClient = createClient<Database>(
    supabaseEnv.url,
    supabaseEnv.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return adminClient;
}
