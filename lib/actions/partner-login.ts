"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

const GENERIC_LOGIN_ERROR = "Invalid email/mobile or password.";

function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function resolvePartnerLoginEmail(identifier: string) {
  const login = identifier.trim();

  if (!login) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const supabase = getSupabaseServiceClient();

  if (login.includes("@")) {
    const { data, error } = await supabase
      .from("profiles" as any)
      .select("email, role")
      .eq("role", "partner")
      .ilike("email", login.toLowerCase())
      .limit(1)
      .maybeSingle();

    const row = data as any;
    if (error || !row?.email) return { error: GENERIC_LOGIN_ERROR };
    return { email: String(row.email).toLowerCase() };
  }

  if (/^(KIA|OZO)\d+$/i.test(login)) {
    const { data, error } = await supabase
      .from("partners" as any)
      .select("id, partner_code, is_active, deleted_at, profiles(email, role)")
      .ilike("partner_code", login.toUpperCase())
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    const row = data as any;
    const profile = Array.isArray(row?.profiles) ? row.profiles[0] : row?.profiles;
    if (error || row?.is_active === false || profile?.role !== "partner" || !profile?.email) {
      return { error: GENERIC_LOGIN_ERROR };
    }
    return { email: String(profile.email).toLowerCase() };
  }

  const mobile = normalizeMobile(login);
  if (!/^\d{10}$/.test(mobile)) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const { data, error } = await supabase
    .from("profiles" as any)
    .select("email, phone, role")
    .eq("role", "partner")
    .ilike("phone", `%${mobile}%`)
    .limit(1)
    .maybeSingle();

  const row = data as any;
  if (error || !row?.email) return { error: GENERIC_LOGIN_ERROR };
  return { email: String(row.email).toLowerCase() };
}
