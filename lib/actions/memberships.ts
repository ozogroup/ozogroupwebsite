"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getReferralUrl } from "@/lib/referral-url";
import { createReferralTreeForPartner, resolvePartnerByCode } from "@/lib/actions/referral-tracking";
import { generateKiaPartnerCode, isPartnerCodeConflict, normalizeKiaPartnerCode } from "@/lib/partner-code";

// =====================================================
// MEMBERSHIP REQUESTS ACTIONS
// =====================================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PartnerInsertResult =
  | { partnerCode: string; referralLink: string }
  | { error: { message?: string } };

async function insertPartnerWithKiaCode(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  partnerData: Record<string, unknown>
): Promise<PartnerInsertResult> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const partnerCode = await generateKiaPartnerCode(supabase);
    const referralLink = getReferralUrl(partnerCode);
    const { error } = await supabase.from("partners" as any).insert({
      ...partnerData,
      partner_code: partnerCode,
      referral_link: referralLink,
    });

    if (!error) return { partnerCode, referralLink };
    if (!isPartnerCodeConflict(error)) return { error };
  }

  return { error: new Error("Unable to reserve a unique partner ID. Please try again.") };
}

function toIndianAuthPhone(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return mobile.trim().startsWith("+") ? mobile.trim() : undefined;
}

export async function getMembershipRequests() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("memberships" as any)
    .select("*, partners:partner_id(partner_code, referral_link, status)")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching membership requests:", error);
    return [];
  }
  
  return data || [];
}

export async function getMembershipById(id: string) {
  const supabase = getSupabaseServerClient();
  
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
  const supabase = getSupabaseServerClient();
  
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

export async function createMembership(data: {
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
}) {
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

  const supabase = getSupabaseServerClient();
  const serviceClient = getSupabaseServiceClient();
  const referralCode = normalizeKiaPartnerCode(data.referral_code) || null;
  const sponsor = await resolvePartnerByCode(serviceClient, referralCode);

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
    return { error: "An account with this email already exists. Please use a different email or log in." };
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
      ? "An account with this email already exists. Please use a different email or log in."
      : "Failed to create user account. Please try again.";
    return { error: message };
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

  const pendingPartner = await insertPartnerWithKiaCode(serviceClient, {
    id: authUserId,
    city: data.city.trim(),
    address: data.address.trim(),
    pin_code: data.pin_code.trim(),
    sponsor_id: (sponsor as any)?.id || null,
    status: "pending",
    wallet_balance: 0,
    total_earnings: 0,
    paid_earnings: 0,
  });

  if ("error" in pendingPartner) {
    console.error("Error creating pending partner:", pendingPartner.error);
    await serviceClient.from("profiles" as any).delete().eq("id", authUserId);
    await serviceClient.auth.admin.deleteUser(authUserId);
    return { error: "Failed to create pending partner request. Please try again." };
  }

  const { data: record, error } = await supabase
    .from("memberships" as any)
    .insert({
      full_name: data.full_name.trim(),
      mobile: data.mobile.trim(),
      email: normalizedEmail,
      partner_id: authUserId,
      city: data.city.trim(),
      address: data.address.trim(),
      pin_code: data.pin_code.trim(),
      amount: 1199,
      referral_code: referralCode,
      sponsor_id: (sponsor as any)?.id || null,
      notes: data.notes?.trim() || null,
      membership_status: "pending_payment",
      payment_status: "pending_payment",
    })
    .select()
    .single();

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

  revalidatePath("/admin/memberships");
  return { data: record };
}

export async function approveAndCreatePartner(membershipId: string) {
  const supabase = getSupabaseServerClient();
  const serviceClient = getSupabaseServiceClient();

  // 1. Fetch membership
  const { data: membership, error: fetchError } = await supabase
    .from("memberships" as any)
    .select("*")
    .eq("id", membershipId)
    .single();

  if (fetchError || !membership) {
    return { error: "Membership not found" };
  }

  // 2. Validate payment is paid
  if ((membership as any).payment_status !== "paid") {
    return { error: "Payment must be marked as paid before approval" };
  }

  // 3. Check if already approved
  if ((membership as any).membership_status === "active") {
    return { error: "Membership is already approved" };
  }

  const email = (membership as any).email;
  const fullName = (membership as any).full_name;
  const mobile = (membership as any).mobile;
  const city = (membership as any).city;
  const pendingPartnerId = (membership as any).partner_id as string | null;

  // 4. Check if profile already exists for this email
  const { data: existingProfile } = await supabase
    .from("profiles" as any)
    .select("id, role")
    .eq(pendingPartnerId ? "id" : "email", pendingPartnerId || email)
    .maybeSingle();

  const profile = existingProfile as any;
  let userId: string;

  if (profile) {
    userId = profile.id;
    // Update role to partner if not already
    if (profile.role !== "partner") {
      await serviceClient
        .from("profiles" as any)
        .update({ role: "partner", updated_at: new Date().toISOString() })
        .eq("id", userId);
    }
  } else {
    // Create auth user via admin API using service role client
    // Must provide an initial password so the user has a password auth method;
    // otherwise updateUser({password}) in the reset flow silently fails.
    const initialPassword = crypto.randomUUID() + crypto.randomUUID();
    const { data: newUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: mobile },
    });

    if (createUserError) {
      console.error("Error creating auth user:", createUserError);
      return { error: "Failed to create user account: " + createUserError.message };
    }

    userId = newUser.user.id;

    // Create profile using service client to bypass RLS
    const { error: profileInsertError } = await serviceClient.from("profiles" as any).insert({
      id: userId,
      email,
      full_name: fullName,
      phone: mobile,
      role: "partner",
    });

    if (profileInsertError) {
      console.error("Error creating profile:", profileInsertError);
      return { error: "Failed to create partner profile: " + profileInsertError.message };
    }
  }

  // 5. Check if partner row already exists
  const { data: existingPartner } = await supabase
    .from("partners" as any)
    .select("id, partner_code, referral_link")
    .eq("id", userId)
    .maybeSingle();

  const partner = existingPartner as any;
  let partnerCode: string;
  let referralLink: string;

  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  if (partner) {
    partnerCode = partner.partner_code;
    referralLink = getReferralUrl(partnerCode);
    // Ensure status is approved
    await serviceClient
      .from("partners" as any)
      .update({
        status: "active",
        membership_started_at: startedAt.toISOString(),
        membership_expires_at: expiresAt.toISOString(),
        membership_purchased_at: startedAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } else {
    const createdPartner = await insertPartnerWithKiaCode(serviceClient, {
      id: userId,
      city,
      status: "active",
      wallet_balance: 0,
      total_earnings: 0,
      paid_earnings: 0,
      membership_purchased_at: startedAt.toISOString(),
      membership_started_at: startedAt.toISOString(),
      membership_expires_at: expiresAt.toISOString(),
    });

    if ("error" in createdPartner) {
      console.error("Error creating partner:", createdPartner.error);
      return { error: "Failed to create partner: " + (createdPartner.error.message || "Unknown error") };
    }

    partnerCode = createdPartner.partnerCode;
    referralLink = createdPartner.referralLink;
  }

  // 8. Update membership
  const { error: updateError } = await serviceClient
    .from("memberships" as any)
    .update({
      membership_status: "active",
      partner_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId);

  if (updateError) {
    console.error("Error updating membership:", updateError);
    return { error: "Failed to update membership: " + updateError.message };
  }

  if ((membership as any).sponsor_id) {
    await createReferralTreeForPartner(serviceClient, userId, (membership as any).sponsor_id);
  }

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
  const supabase = getSupabaseServerClient();

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

export async function repairPartnerAuthUser(email: string) {
  "use server";
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
