"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getReferralUrl } from "@/lib/referral-url";
import { resolvePartnerByCode, createReferralTreeForPartner } from "@/lib/actions/referral-tracking";
import { normalizeKiaPartnerCode, generateKiaPartnerCode, isPartnerCodeConflict } from "@/lib/partner-code";
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
    .select([
      "id", "membership_id", "full_name", "mobile", "email", "city", "address", "pin_code",
      "referral_code", "sponsor_id", "partner_id", "amount",
      "payment_status", "membership_status", "payment_id",
      "notes", "admin_notes", "is_active", "created_at", "updated_at",
      "partners:partner_id(partner_code, referral_link, status)",
      "sponsor:partners!memberships_sponsor_id_fkey(partner_code, profiles(full_name))",
    ].join(", "))
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

// Flat ₹500 reward paid to the direct sponsor when a new paid membership is
// approved. Created as "approved" and wallet credited immediately — the admin
// approving the membership IS the approval of the reward, no second approval
// step required. Idempotent: duplicate calls for the same membership are safe.
async function generateMembershipReferralCommission(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  membership: { id: string; amount: number | null; sponsor_id: string | null }
) {
  if (!membership.sponsor_id) return;

  const { data: sponsor } = await supabase
    .from("partners" as any)
    .select("status, is_active, deleted_at, membership_expires_at, wallet_balance, total_earnings")
    .eq("id", membership.sponsor_id)
    .maybeSingle();
  const sp = sponsor as any;
  const sponsorEligible =
    sp &&
    sp.status === "active" &&
    sp.is_active !== false &&
    !sp.deleted_at &&
    (!sp.membership_expires_at || new Date(sp.membership_expires_at).getTime() >= Date.now());
  if (!sponsorEligible) return;

  const { data: settings } = await supabase
    .from("system_settings" as any)
    .select("membership_referral_bonus_amount")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const bonusAmount = Number((settings as any)?.membership_referral_bonus_amount ?? 500);
  if (!(bonusAmount > 0)) return;

  const { data: existing } = await supabase
    .from("commissions" as any)
    .select("id")
    .eq("source_type", "membership")
    .eq("source_id", membership.id)
    .eq("partner_id", membership.sponsor_id)
    .eq("level", 1)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return;

  const { data: inserted, error } = await supabase.from("commissions" as any).insert({
    partner_id: membership.sponsor_id,
    source_type: "membership",
    source_id: membership.id,
    source_amount: membership.amount || 0,
    level: 1,
    percentage: 0,
    amount: bonusAmount,
    status: "approved",
  }).select("id").single();
  if (error) {
    if (error.code === "23505") return;
    console.error("Error creating membership referral commission:", error);
    return;
  }

  // Credit wallet immediately — the membership approval IS the reward approval.
  const walletBefore = Number(sp.wallet_balance || 0);
  const walletAfter = Math.round((walletBefore + bonusAmount) * 100) / 100;
  const totalBefore = Number(sp.total_earnings || 0);
  const now = new Date().toISOString();

  await supabase
    .from("partners" as any)
    .update({
      wallet_balance: walletAfter,
      total_earnings: Math.round((totalBefore + bonusAmount) * 100) / 100,
      updated_at: now,
    })
    .eq("id", membership.sponsor_id);

  await supabase.from("wallet_transactions" as any).insert({
    partner_id: membership.sponsor_id,
    transaction_type: "commission_credit",
    amount: bonusAmount,
    balance_before: walletBefore,
    balance_after: walletAfter,
    reference_type: "commission",
    reference_id: (inserted as any)?.id || null,
    notes: `Membership referral reward Rs. ${bonusAmount} auto-approved`,
  });
}

// JS fallback for kia_approve_paid_membership. The RPC is tried first (it is
// atomic and row-locked, which this fallback cannot fully replicate with
// separate Supabase calls); this only runs if the RPC itself is missing from
// the database, so membership approval never becomes a hard launch blocker.
async function approveAndCreatePartnerFallback(membershipId: string) {
  const supabase = getSupabaseServiceClient();

  const { data: membership, error: membershipError } = await supabase
    .from("memberships" as any)
    .select("*")
    .eq("id", membershipId)
    .single();
  if (membershipError || !membership) return { error: "Membership not found." };
  const m = membership as any;

  if (m.payment_status !== "paid") return { error: "Payment must be marked paid before approval." };
  if (m.membership_status === "rejected") return { error: "Rejected membership cannot be approved." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles" as any)
    .select("*")
    .eq("id", m.partner_id)
    .maybeSingle();
  if (profileError || !profile) return { error: `Linked profile/auth user not found for membership ${membershipId}` };
  const prof = profile as any;

  const approvedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existingPartner } = await supabase
    .from("partners" as any)
    .select("*")
    .eq("id", prof.id)
    .maybeSingle();

  let partnerRow: any;
  if (!existingPartner) {
    const { data: inserted, error: insertError } = await supabase
      .from("partners" as any)
      .insert({
        id: prof.id,
        partner_code: null,
        city: m.city,
        address: m.address,
        pin_code: m.pin_code,
        sponsor_id: m.sponsor_id,
        status: "active",
        wallet_balance: 0,
        total_earnings: 0,
        paid_earnings: 0,
        membership_purchased_at: approvedAt,
        membership_started_at: approvedAt,
        membership_expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();
    if (insertError) return { error: insertError.message };
    partnerRow = inserted;
  } else {
    const ep = existingPartner as any;
    const { data: updated, error: updateError } = await supabase
      .from("partners" as any)
      .update({
        status: "active",
        is_active: true,
        sponsor_id: ep.sponsor_id || m.sponsor_id,
        city: ep.city || m.city,
        address: ep.address || m.address,
        pin_code: ep.pin_code || m.pin_code,
        membership_purchased_at: ep.membership_purchased_at || approvedAt,
        membership_started_at: ep.membership_started_at || approvedAt,
        membership_expires_at: ep.membership_expires_at || expiresAt,
        updated_at: approvedAt,
      })
      .eq("id", ep.id)
      .select()
      .single();
    if (updateError) return { error: updateError.message };
    partnerRow = updated;
  }

  // The DB trigger trg_kia_assign_partner_code_on_activation normally
  // assigns partner_code on this same status update. If that trigger is also
  // missing, generate one here so approval never gets stuck without an ID.
  if (!partnerRow.partner_code) {
    for (let attempt = 0; attempt < 5 && !partnerRow.partner_code; attempt += 1) {
      const candidate = await generateKiaPartnerCode(supabase);
      const { data: coded, error: codeError } = await supabase
        .from("partners" as any)
        .update({ partner_code: candidate, referral_link: getReferralUrl(candidate) })
        .eq("id", partnerRow.id)
        .select()
        .single();
      if (!codeError) {
        partnerRow = coded;
        break;
      }
      if (!isPartnerCodeConflict(codeError)) {
        return { error: codeError.message };
      }
    }
  }

  await supabase
    .from("profiles" as any)
    .update({ role: "partner", membership_status: "active", partner_code: partnerRow.partner_code, updated_at: approvedAt })
    .eq("id", prof.id);

  await supabase
    .from("memberships" as any)
    .update({ partner_id: prof.id, membership_status: "active", updated_at: approvedAt })
    .eq("id", membershipId);

  if (m.sponsor_id && m.sponsor_id !== prof.id) {
    await createReferralTreeForPartner(supabase, prof.id, m.sponsor_id);
    await generateMembershipReferralCommission(supabase, { id: membershipId, amount: m.amount, sponsor_id: m.sponsor_id });
  }

  return {
    data: {
      partner_id: partnerRow.id,
      partner_code: partnerRow.partner_code,
      referral_link: partnerRow.referral_link || getReferralUrl(partnerRow.partner_code),
      full_name: m.full_name,
      email: m.email,
      phone: m.mobile,
      city: m.city,
      approved_at: approvedAt,
    },
  };
}

export async function approveAndCreatePartner(membershipId: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const { data, error } = await (supabase as any).rpc("kia_approve_paid_membership", {
    membership_uuid: membershipId,
  });

  let approved: any;
  if (error) {
    const message = `${error.message || ""} ${(error as any).details || ""}`;
    if (!/kia_approve_paid_membership|function .* does not exist|schema cache|Admin access required/i.test(message)) {
      console.error("Error approving membership:", error);
      return { error: error.message || "Failed to approve membership." };
    }
    console.error("Membership approval RPC unavailable; using server fallback:", error);
    const fallbackResult = await approveAndCreatePartnerFallback(membershipId);
    if ((fallbackResult as any).error) return fallbackResult;
    approved = (fallbackResult as any).data;
  } else {
    approved = Array.isArray(data) ? data[0] : data;
  }

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
  revalidatePath("/admin/commissions");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/team");
  revalidatePath("/partner/direct-team");
  revalidatePath("/partner/income");
  revalidatePath("/partner/commissions");

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
