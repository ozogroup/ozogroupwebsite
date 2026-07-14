"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getReferralUrl } from "@/lib/referral-url";
import { resolvePartnerByCode } from "@/lib/actions/referral-tracking";
import { normalizeKiaPartnerCode } from "@/lib/partner-code";
import { syncMembershipCreated, syncPartnerApproved } from "@/lib/integrations/google-sheet-sync";

// =====================================================
// MEMBERSHIP REQUESTS ACTIONS
// =====================================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MembershipRegistrationInput = {
  full_name: string;
  mobile: string;
  email: string;
  city: string;
  address: string;
  pin_code: string;
  referral_code?: string;
  notes?: string;
  password: string;
  confirm_password: string;
};

function toIndianAuthPhone(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return mobile.trim().startsWith("+") ? mobile.trim() : undefined;
}

async function getMembershipAmount(supabase: ReturnType<typeof getSupabaseServiceClient>) {
  const { data } = await supabase
    .from("system_settings" as any)
    .select("membership_price")
    .limit(1)
    .maybeSingle();

  return Number((data as any)?.membership_price || 1199);
}

function duplicateMembershipMessage() {
  return "This email is already registered. Please log in to the Partner Portal or use Forgot Password.";
}

export async function lookupReferralCode(referralCode: string, currentEmail?: string) {
  const code = normalizeKiaPartnerCode(referralCode);
  if (!code) return { valid: true, partnerName: "", partnerCode: "" };

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("partners" as any)
    .select("id, partner_code, status, is_active, deleted_at, profiles(email, full_name)")
    .eq("partner_code", code)
    .maybeSingle();

  const row = data as any;
  const profile = Array.isArray(row?.profiles) ? row.profiles[0] : row?.profiles;
  if (error || !row || row.status !== "active" || row.is_active === false || row.deleted_at) {
    return { valid: false, partnerName: "", partnerCode: code };
  }

  if (currentEmail && profile?.email?.toLowerCase() === currentEmail.trim().toLowerCase()) {
    return { valid: false, partnerName: "", partnerCode: code, error: "Self-referral is not allowed." };
  }

  return {
    valid: true,
    partnerName: profile?.full_name || "KIA Partner",
    partnerCode: row.partner_code,
  };
}

export async function getMembershipRequests() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("memberships" as any)
    .select("*, partners:partner_id(partner_code, referral_link, status), sponsor:partners!memberships_sponsor_id_fkey(partner_code, profiles(full_name))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching membership requests:", error);
    return {
      data: [],
      error: error.message,
      diagnostics: {
        table: "memberships",
        projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
          : "unknown",
      },
    };
  }

  return {
    data: data || [],
    error: null,
    diagnostics: {
      table: "memberships",
      projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
        : "unknown",
      count: data?.length || 0,
    },
  };
}

export async function getSponsoredMembershipRequests(limit = 8) {
  const profile = await requirePartner();
  const serviceClient = getSupabaseServiceClient();
  const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 8));

  const { data, error } = await serviceClient
    .from("memberships" as any)
    .select("id, full_name, mobile, email, city, created_at, membership_status, payment_status, referral_code, partner_id, partners:partner_id(partner_code, status, created_at, membership_expires_at)")
    .eq("sponsor_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("Error fetching sponsored membership requests:", error);
    return [];
  }

  return data || [];
}

export async function getMembershipById(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("memberships" as any)
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching membership request:", error);
    return null;
  }
  
  return data;
}

export async function updateMembershipStatus(id: string, status: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("memberships" as any)
    .update({ 
      membership_status: status, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating membership status:", error);
    throw error;
  }
  
  revalidatePath("/admin/memberships");
  return data;
}

export async function createMembership(data: MembershipRegistrationInput) {
  // Validation
  if (!data.full_name?.trim()) return { error: "Full name is required" };
  if (!data.mobile?.trim()) return { error: "Mobile number is required" };
  if (!data.email?.trim()) return { error: "Email is required" };
  if (!data.city?.trim()) return { error: "City is required" };
  if (!data.address?.trim()) return { error: "Address is required" };
  if (!data.pin_code?.trim()) return { error: "Pin code is required" };

  const normalizedEmail = data.email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) return { error: "Invalid email format" };

  const mobileRegex = /^\+?[\d\s\-()]{7,15}$/;
  if (!mobileRegex.test(data.mobile)) return { error: "Invalid mobile number" };
  if (!data.password) return { error: "Password is required" };
  if (data.password.length < 8) return { error: "Password must be at least 8 characters." };
  if (data.password !== data.confirm_password) {
    return { error: "Password and Confirm Password do not match." };
  }

  const supabase = await getSupabaseServerClient();
  const serviceClient = getSupabaseServiceClient();
  const referralCode = normalizeKiaPartnerCode(data.referral_code) || null;
  const sponsor = await resolvePartnerByCode(serviceClient, referralCode);
  const membershipAmount = await getMembershipAmount(serviceClient);

  if (referralCode && !sponsor) {
    return { error: "Referral ID not found" };
  }

  const { data: existingProfile, error: existingProfileError } = await serviceClient
    .from("profiles" as any)
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    console.error("Error checking existing profile:", existingProfileError);
    return { error: "Unable to verify email. Please try again." };
  }

  if (existingProfile) {
    return { error: duplicateMembershipMessage(), duplicate: true };
  }

  if (sponsor && (sponsor as any).id) {
    const { data: sponsorProfile } = await serviceClient
      .from("profiles" as any)
      .select("email")
      .eq("id", (sponsor as any).id)
      .maybeSingle();

    if ((sponsorProfile as any)?.email?.toLowerCase() === normalizedEmail) {
      return { error: "Self-referral is not allowed." };
    }
  }

  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: normalizedEmail,
    phone: toIndianAuthPhone(data.mobile),
    password: data.password,
    email_confirm: true,
    phone_confirm: Boolean(toIndianAuthPhone(data.mobile)),
    user_metadata: {
      full_name: data.full_name.trim(),
      phone: data.mobile.trim(),
    },
  });

  if (authError || !authUser.user) {
    console.error("Error creating auth user:", authError);
    const message = authError?.message?.toLowerCase().includes("already")
      ? duplicateMembershipMessage()
      : "Failed to create user account. Please try again.";
    return { error: message, duplicate: authError?.message?.toLowerCase().includes("already") };
  }

  const authUserId = authUser.user.id;
  const { error: profileInsertError } = await serviceClient.from("profiles" as any).insert({
    id: authUserId,
    email: normalizedEmail,
    full_name: data.full_name.trim(),
    phone: data.mobile.trim(),
    role: "customer",
    email_verified: true,
  });

  if (profileInsertError) {
    console.error("Error creating profile:", profileInsertError);
    await serviceClient.auth.admin.deleteUser(authUserId);
    return { error: "Failed to create user profile. Please try again." };
  }

  const { error: pendingPartnerError } = await serviceClient.from("partners" as any).insert({
    id: authUserId,
    city: data.city.trim(),
    address: data.address.trim(),
    pin_code: data.pin_code.trim(),
    sponsor_id: (sponsor as any)?.id || null,
    partner_code: null,
    referral_link: null,
    status: "pending",
    wallet_balance: 0,
    total_earnings: 0,
    paid_earnings: 0,
  });

  if (pendingPartnerError) {
    console.error("Error creating pending partner:", pendingPartnerError);
    await serviceClient.from("profiles" as any).delete().eq("id", authUserId);
    await serviceClient.auth.admin.deleteUser(authUserId);
    return { error: "Failed to create pending partner request. Please try again." };
  }

  const membershipPayload: Record<string, unknown> = {
    full_name: data.full_name.trim(),
    mobile: data.mobile.trim(),
    email: normalizedEmail,
    partner_id: authUserId,
    city: data.city.trim(),
    address: data.address.trim(),
    pin_code: data.pin_code.trim(),
    amount: membershipAmount,
    referral_code: referralCode,
    sponsor_id: (sponsor as any)?.id || null,
    notes: data.notes?.trim() || null,
    membership_status: "pending_payment",
    payment_status: "pending_payment",
    payment_gateway: "manual",
    payment_amount: membershipAmount,
    razorpay_order_id: null,
    razorpay_payment_id: null,
  };

  let membershipResult = await serviceClient
    .from("memberships" as any)
    .insert(membershipPayload)
    .select()
    .single();

  if (
    membershipResult.error &&
    /payment_gateway|payment_amount|razorpay_order_id|razorpay_payment_id/i.test(membershipResult.error.message || "")
  ) {
    const fallbackPayload = { ...membershipPayload };
    delete fallbackPayload.payment_gateway;
    delete fallbackPayload.payment_amount;
    delete fallbackPayload.razorpay_order_id;
    delete fallbackPayload.razorpay_payment_id;
    membershipResult = await serviceClient
      .from("memberships" as any)
      .insert(fallbackPayload)
      .select()
      .single();
  }

  const { data: record, error } = membershipResult;

  if (error) {
    console.error("Error creating membership:", error);
    await serviceClient.from("partners" as any).delete().eq("id", authUserId);
    await serviceClient.from("profiles" as any).delete().eq("id", authUserId);
    await serviceClient.auth.admin.deleteUser(authUserId);
    return { error: error.message };
  }

  if ((sponsor as any)?.id && referralCode) {
    await serviceClient
      .from("referral_clicks" as any)
      .update({ converted_to_membership: true })
      .eq("partner_id", (sponsor as any).id)
      .eq("referral_code", referralCode);
  }

  await syncMembershipCreated({
    id: (record as any).id,
    full_name: data.full_name.trim(),
    email: normalizedEmail,
    phone: data.mobile.trim(),
    city: data.city.trim(),
    status: (record as any).membership_status,
    created_at: (record as any).created_at,
  });

  revalidatePath("/admin/memberships");
  return { data: record };
}

export async function createSponsoredMembership(
  data: Omit<MembershipRegistrationInput, "referral_code">
) {
  const profile = await requirePartner();
  const serviceClient = getSupabaseServiceClient();
  const { data: partner, error } = await serviceClient
    .from("partners" as any)
    .select("partner_code, status")
    .eq("id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Partner account not found. Please contact support." };
  }

  if ((partner as any).status !== "active") {
    return { error: "Only active partners can register new members." };
  }

  const result = await createMembership({
    ...data,
    referral_code: (partner as any).partner_code,
  });

  if (!result.error) {
    revalidatePath("/partner/dashboard");
    revalidatePath("/partner/direct-team");
    revalidatePath("/partner/team");
  }

  return result;
}

export async function approveAndCreatePartner(membershipId: string) {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await (supabase as any).rpc("kia_approve_paid_membership", {
    membership_uuid: membershipId,
  });

  if (error) {
    console.error("Error approving membership:", error);
    return { error: error.message || "Failed to approve membership." };
  }

  const approved = Array.isArray(data) ? data[0] : data;
  if (!approved?.partner_code) {
    return { error: "Membership approval did not return a Partner ID." };
  }

  const partnerCode = approved.partner_code as string;
  const referralLink = approved.referral_link || getReferralUrl(partnerCode);
  const userId = approved.partner_id as string;
  const fullName = approved.full_name as string;
  const email = approved.email as string;
  const mobile = approved.phone as string;
  const city = approved.city as string;
  const approvedAt = approved.approved_at as string;

  await syncPartnerApproved({
    id: userId,
    partner_code: partnerCode,
    full_name: fullName,
    email,
    phone: mobile,
    city,
    approved_at: approvedAt,
  });

  revalidatePath("/admin/memberships");
  revalidatePath("/admin/partners");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/team");
  revalidatePath("/partner/direct-team");

  return {
    data: {
      partner_code: partnerCode,
      referral_link: referralLink,
      email,
      full_name: fullName,
    },
  };
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("memberships" as any)
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }

  revalidatePath("/admin/memberships");
  return data;
}

export async function updateMembershipAdminNotes(id: string, adminNotes: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("memberships" as any)
    .update({
      admin_notes: adminNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating membership admin notes:", error);
    throw error;
  }

  revalidatePath("/admin/memberships");
  return data;
}

export async function repairPartnerAuthUser(email: string) {
  "use server";
  await requireAdmin();
  const serviceClient = getSupabaseServiceClient();

  if (!email?.trim()) {
    return { error: "Email is required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return { error: "Failed to list auth users: " + listError.message };
  }

  const authUser = users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
  if (!authUser) {
    return { error: `No auth user found for email: ${normalizedEmail}` };
  }

  const tempPassword = crypto.randomUUID() + crypto.randomUUID();
  const { error: updateError } = await serviceClient.auth.admin.updateUserById(
    authUser.id,
    { password: tempPassword, email_confirm: true }
  );

  if (updateError) {
    console.error("Error updating auth user:", updateError);
    return { error: "Failed to repair auth user: " + updateError.message };
  }

  console.log(`[REPAIR] Auth user ${authUser.id} (${normalizedEmail}) repaired.`);
  return {
    data: {
      message: "Partner auth repaired. Ask partner to use Forgot Password again.",
      userId: authUser.id,
      email: normalizedEmail,
    },
  };
}
