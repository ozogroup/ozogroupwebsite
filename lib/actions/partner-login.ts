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

  if (login.includes("@")) {
    return { email: login.toLowerCase() };
  }

  const mobile = normalizeMobile(login);
  if (!/^\d{10}$/.test(mobile)) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles" as any)
    .select("email, phone, role")
    .eq("role", "partner")
    .ilike("phone", `%${mobile}%`)
    .limit(1)
    .maybeSingle();

  const row = data as any;

  if (error || !row?.email) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  return { email: String(row.email).toLowerCase() };
}
