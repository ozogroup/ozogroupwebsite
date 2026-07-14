"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

const GENERIC_LOGIN_ERROR = "Invalid email/mobile or password.";
const LOGIN_MESSAGES = {
  payment_pending: "Your membership payment is pending. Please complete payment or contact support.",
  approval_pending: "Your payment is received. Admin approval is pending.",
  rejected: "This membership request was rejected. Please contact support.",
  suspended: "This partner account is suspended. Please contact support.",
  inactive: "This partner account is inactive. Please contact support.",
  not_partner: "Your partner access is not active yet. Please contact support.",
};

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
    return { email: login.toLowerCase() };
  }

  if (/^(KIA|OZO)\d+$/i.test(login)) {
    const { data, error } = await supabase
      .from("partners" as any)
      .select("id, partner_code, is_active, deleted_at, profiles(email)")
      .ilike("partner_code", login.toUpperCase())
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    const row = data as any;
    const profile = Array.isArray(row?.profiles) ? row.profiles[0] : row?.profiles;
    if (error || row?.is_active === false || !profile?.email) {
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
    .select("email, phone")
    .ilike("phone", `%${mobile}%`)
    .limit(1)
    .maybeSingle();

  const row = data as any;
  if (error || !row?.email) return { error: GENERIC_LOGIN_ERROR };
  return { email: String(row.email).toLowerCase() };
}

export async function getPartnerLoginAccessStatus(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { allowed: false, message: GENERIC_LOGIN_ERROR };

  const supabase = getSupabaseServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles" as any)
    .select("id, email, role")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (profileError || !profile) {
    return { allowed: false, message: GENERIC_LOGIN_ERROR };
  }

  const { data: membership } = await supabase
    .from("memberships" as any)
    .select("payment_status, membership_status")
    .eq("partner_id", (profile as any).id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: partner } = await supabase
    .from("partners" as any)
    .select("status, is_active, deleted_at")
    .eq("id", (profile as any).id)
    .maybeSingle();

  const membershipStatus = (membership as any)?.membership_status;
  const paymentStatus = (membership as any)?.payment_status;
  const partnerStatus = (partner as any)?.status;

  if (membershipStatus === "rejected") return { allowed: false, message: LOGIN_MESSAGES.rejected };
  if (partnerStatus === "suspended") return { allowed: false, message: LOGIN_MESSAGES.suspended };
  if (partnerStatus === "inactive" || (partner as any)?.is_active === false || (partner as any)?.deleted_at) {
    return { allowed: false, message: LOGIN_MESSAGES.inactive };
  }
  if (paymentStatus && paymentStatus !== "paid") {
    return { allowed: false, message: LOGIN_MESSAGES.payment_pending };
  }
  if (paymentStatus === "paid" && membershipStatus !== "active") {
    return { allowed: false, message: LOGIN_MESSAGES.approval_pending };
  }
  if ((profile as any).role !== "partner" || partnerStatus !== "active") {
    return { allowed: false, message: LOGIN_MESSAGES.not_partner };
  }

  return { allowed: true, message: "active" };
}
