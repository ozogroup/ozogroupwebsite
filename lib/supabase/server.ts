/**
 * Server-side Supabase client (request-scoped).
 * Use in Server Components, Route Handlers and Server Actions.
 * Reads/writes auth cookies via Next.js cookies().
 */

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseEnv, assertSupabaseServiceRole } from "./env";
import type { Database } from "./types";

export async function getSupabaseServerClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component context: cookies are read-only. Ignored.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Component context: cookies are read-only. Ignored.
        }
      },
    },
  });
}

/**
 * Service-role Supabase client for admin operations (auth.admin.createUser, etc).
 * Only use in server actions — never expose to client.
 */
export function getSupabaseServiceClient() {
  assertSupabaseServiceRole();
  return createClient<Database>(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
