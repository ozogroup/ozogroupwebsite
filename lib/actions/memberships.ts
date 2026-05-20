"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

// =====================================================
// MEMBERSHIP REQUESTS ACTIONS
// =====================================================

export async function getMembershipRequests() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("memberships" as any)
    .select("*, partners:partner_id(partner_code, referral_link)")
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
}) {
  // Validation
  if (!data.full_name?.trim()) return { error: "Full name is required" };
  if (!data.mobile?.trim()) return { error: "Mobile number is required" };
  if (!data.email?.trim()) return { error: "Email is required" };
  if (!data.city?.trim()) return { error: "City is required" };
  if (!data.address?.trim()) return { error: "Address is required" };
  if (!data.pin_code?.trim()) return { error: "Pin code is required" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return { error: "Invalid email format" };

  const mobileRegex = /^\+?[\d\s\-()]{7,15}$/;
  if (!mobileRegex.test(data.mobile)) return { error: "Invalid mobile number" };

  const supabase = getSupabaseServerClient();

  const { data: record, error } = await supabase
    .from("memberships" as any)
    .insert({
      full_name: data.full_name.trim(),
      mobile: data.mobile.trim(),
      email: data.email.trim(),
      city: data.city.trim(),
      address: data.address.trim(),
      pin_code: data.pin_code.trim(),
      amount: 1199,
      referral_code: data.referral_code?.trim() || null,
      notes: data.notes?.trim() || null,
      membership_status: "pending_payment",
      payment_status: "pending_payment",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating membership:", error);
    return { error: error.message };
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
  if ((membership as any).membership_status === "approved" || (membership as any).membership_status === "active") {
    return { error: "Membership is already approved" };
  }

  const email = (membership as any).email;
  const fullName = (membership as any).full_name;
  const mobile = (membership as any).mobile;
  const city = (membership as any).city;

  // 4. Check if profile already exists for this email
  const { data: existingProfile } = await supabase
    .from("profiles" as any)
    .select("id, role")
    .eq("email", email)
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
    const { data: newUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
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

  if (partner) {
    partnerCode = partner.partner_code;
    referralLink = partner.referral_link || `${process.env.NEXT_PUBLIC_SITE_URL || "https://ozo.group"}/?ref=${partnerCode}`;
    // Ensure status is approved
    await serviceClient
      .from("partners" as any)
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", userId);
  } else {
    // 6. Generate unique partner_code
    const { data: lastPartner } = await supabase
      .from("partners" as any)
      .select("partner_code")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastPartners = lastPartner as any[];
    let nextNumber = 1001;
    if (lastPartners && lastPartners.length > 0) {
      const lastCode = lastPartners[0].partner_code;
      const num = parseInt(lastCode.replace("OZO", ""), 10);
      if (!isNaN(num)) nextNumber = num + 1;
    }

    partnerCode = `OZO${nextNumber}`;
    referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://ozo.group"}/?ref=${partnerCode}`;

    // 7. Create partner row
    const { error: partnerError } = await serviceClient.from("partners" as any).insert({
      id: userId,
      partner_code: partnerCode,
      referral_link: referralLink,
      city,
      status: "approved",
      wallet_balance: 0,
      total_earnings: 0,
      paid_earnings: 0,
      membership_purchased_at: new Date().toISOString(),
    });

    if (partnerError) {
      console.error("Error creating partner:", partnerError);
      return { error: "Failed to create partner: " + partnerError.message };
    }
  }

  // 8. Update membership
  const { error: updateError } = await serviceClient
    .from("memberships" as any)
    .update({
      membership_status: "approved",
      partner_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId);

  if (updateError) {
    console.error("Error updating membership:", updateError);
    return { error: "Failed to update membership: " + updateError.message };
  }

  revalidatePath("/admin/memberships");
  revalidatePath("/admin/partners");

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

