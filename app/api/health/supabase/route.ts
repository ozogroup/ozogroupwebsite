import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health/supabase
 *
 * Verifies that the Supabase client can be initialized and reach the project.
 * Does not query any tables (none exist yet). Calls auth.getSession() which
 * succeeds against any valid Supabase project + anon key.
 */
export async function GET() {
  const startedAt = Date.now();

  if (!supabaseEnv.isConfigured) {
    const payload = {
      ok: false,
      configured: false,
      message:
        "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      url: null,
    };
    console.error("[Supabase] Health check failed:", payload.message);
    return NextResponse.json(payload, { status: 500 });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.getSession();
    const elapsed = Date.now() - startedAt;

    if (error) {
      console.error("[Supabase] Connection error:", error.message);
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          message: error.message,
          url: supabaseEnv.url,
          elapsedMs: elapsed,
        },
        { status: 500 }
      );
    }

    console.log(
      `[Supabase] ✓ Connected to ${supabaseEnv.url} in ${elapsed}ms`
    );
    return NextResponse.json({
      ok: true,
      configured: true,
      message: "Supabase client initialized and reachable.",
      url: supabaseEnv.url,
      hasServiceRole: Boolean(supabaseEnv.serviceRoleKey),
      elapsedMs: elapsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Supabase] Health check exception:", message);
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message,
        url: supabaseEnv.url,
      },
      { status: 500 }
    );
  }
}
