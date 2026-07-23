"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";
import { validateStrongPassword } from "@/lib/security/password";

const RESET_WINDOW_MINUTES = 15;
const ACCOUNT_RESET_LIMIT = 3;
const IP_RESET_LIMIT = 5;
const NEUTRAL_RESET_MESSAGE =
  "If the provided details are registered, a password reset link has been sent to the registered email address.";

function normalizeIdentifier(input: string) {
  return input.trim().toLowerCase();
}

function normalizePartnerCode(input: string) {
  return input.trim().toUpperCase();
}

function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function hashPrivate(value: string) {
  const salt = process.env.PASSWORD_RESET_RATE_LIMIT_SALT || supabaseEnv.url || "kia-skin-care";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "registered email";
  const visible = name.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, Math.min(8, name.length - 1)))}@${domain}`;
}

function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) return "https://kiaskincare.com";
  const url = configured.startsWith("http") ? configured : `https://${configured}`;
  return url.replace(/\/+$/, "");
}

async function getRequestContext() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  return {
    ipHash: hashPrivate(ip),
    userAgent: (headerStore.get("user-agent") || "").slice(0, 500),
  };
}

async function resolvePartnerResetEmail(identifier: string) {
  const supabase = getSupabaseServiceClient();
  const login = identifier.trim();
  if (!login) return null;

  async function activePartnerForProfile(profile: any) {
    if (!profile?.id || profile.role !== "partner" || !profile.email) return null;
    const { data: partner } = await supabase
      .from("partners" as any)
      .select("id, partner_code, status, is_active, deleted_at")
      .eq("id", profile.id)
      .maybeSingle();
    const row = partner as any;
    if (!row || row.status !== "active" || row.is_active === false || row.deleted_at) return null;
    return {
      email: String(profile.email).toLowerCase(),
      partnerId: row.id as string,
      partnerCode: String(row.partner_code || ""),
      partnerName: String(profile.full_name || "KIA Partner"),
    };
  }

  if (login.includes("@")) {
    const email = normalizeIdentifier(login);
    const { data } = await supabase
      .from("profiles" as any)
      .select("id, email, role, full_name")
      .eq("email", email)
      .maybeSingle();
    return activePartnerForProfile(data);
  }

  if (/^(KIA|OZO)\d+$/i.test(login)) {
    const { data } = await supabase
      .from("partners" as any)
      .select("id, partner_code, status, is_active, deleted_at, profiles(email, full_name, role)")
      .eq("partner_code", normalizePartnerCode(login))
      .maybeSingle();
    const row = data as any;
    const profile = Array.isArray(row?.profiles) ? row.profiles[0] : row?.profiles;
    if (!profile?.email || profile.role !== "partner" || row?.status !== "active" || row?.is_active === false || row?.deleted_at) {
      return null;
    }
    return {
      email: String(profile.email).toLowerCase(),
      partnerId: row.id as string,
      partnerCode: String(row.partner_code || ""),
      partnerName: String(profile.full_name || "KIA Partner"),
    };
  }

  const mobile = normalizeMobile(login);
  if (!/^\d{10}$/.test(mobile)) return null;

  const { data } = await supabase
    .from("profiles" as any)
    .select("id, email, role, full_name")
    .ilike("phone", `%${mobile}%`)
    .limit(1)
    .maybeSingle();
  return activePartnerForProfile(data);
}

async function withinResetRateLimit(identifier: string, accountEmail: string | null) {
  const supabase = getSupabaseServiceClient();
  const context = await getRequestContext();
  const since = new Date(Date.now() - RESET_WINDOW_MINUTES * 60 * 1000).toISOString();
  const identifierHash = hashPrivate(normalizeIdentifier(identifier));
  const accountHash = accountEmail ? hashPrivate(accountEmail) : null;

  const { count: ipCount, error: ipError } = await supabase
    .from("partner_password_reset_requests" as any)
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", context.ipHash)
    .gte("created_at", since);

  if (ipError && ipError.code !== "42P01") {
    console.error("Password reset IP rate query failed:", ipError.message);
  }

  let accountCount = 0;
  if (accountHash) {
    const { count, error } = await supabase
      .from("partner_password_reset_requests" as any)
      .select("id", { count: "exact", head: true })
      .eq("account_hash", accountHash)
      .gte("created_at", since);
    if (error && error.code !== "42P01") {
      console.error("Password reset account rate query failed:", error.message);
    }
    accountCount = count || 0;
  }

  const tableMissing = ipError?.code === "42P01";
  const allowed = tableMissing || (ipCount || 0) < IP_RESET_LIMIT && accountCount < ACCOUNT_RESET_LIMIT;

  if (!tableMissing) {
    await supabase.from("partner_password_reset_requests" as any).insert({
      identifier_hash: identifierHash,
      account_hash: accountHash,
      ip_hash: context.ipHash,
      user_agent: context.userAgent,
      result: allowed ? "accepted" : "rate_limited",
    });
  }

  return allowed;
}

export async function requestPartnerPasswordReset(identifier: string) {
  const login = identifier.trim();
  if (!login) {
    return { ok: false, message: "Please enter your Partner ID or registered email.", maskedEmail: null };
  }

  const resolved = await resolvePartnerResetEmail(login);
  const allowed = await withinResetRateLimit(login, resolved?.email || null);

  if (resolved && allowed) {
    const supabase = getSupabaseServiceClient();
    const redirectTo = `${getSiteUrl()}/partner/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(resolved.email, {
      redirectTo,
    });

    if (error) {
      console.error("Partner password reset email failed:", error.message);
    } else {
      await supabase.from("activity_logs" as any).insert({
        actor_id: resolved.partnerId,
        actor_role: "partner",
        action: "partner_password_reset_requested",
        entity_type: "profiles",
        entity_id: resolved.partnerId,
        new_value: {
          partner_code: resolved.partnerCode,
          email_masked: maskEmail(resolved.email),
          redirect_host: new URL(redirectTo).hostname,
        },
      });
    }
  }

  return { ok: true, message: NEUTRAL_RESET_MESSAGE, maskedEmail: resolved ? maskEmail(resolved.email) : null };
}

export async function changePartnerPassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  const profile = await requirePartner();
  const email = String(profile.email || "").trim().toLowerCase();

  if (!email) {
    return { ok: false, message: "Your partner account email is missing. Please contact support." };
  }

  if (!currentPassword) {
    return { ok: false, message: "Current password is required." };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "New password and confirm password do not match." };
  }

  const passwordCheck = validateStrongPassword(newPassword);
  if (!passwordCheck.valid) {
    return { ok: false, message: "Please choose a stronger password." };
  }

  const verifier = createClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: authError } = await verifier.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (authError) {
    return { ok: false, message: "Current password is incorrect." };
  }

  await verifier.auth.signOut();

  const serviceClient = getSupabaseServiceClient();
  const { error: updateError } = await serviceClient.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error("Partner password change failed:", updateError.message);
    return { ok: false, message: "Password could not be updated. Please try again." };
  }

  await serviceClient.from("activity_logs" as any).insert({
    actor_id: profile.id,
    actor_role: "partner",
    action: "partner_password_changed",
    entity_type: "profiles",
    entity_id: profile.id,
    new_value: { method: "partner_portal" },
  });

  revalidatePath("/partner/security");
  return { ok: true, message: "Your password has been updated successfully." };
}
