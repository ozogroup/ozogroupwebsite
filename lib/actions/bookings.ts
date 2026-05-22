"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

// =====================================================
// BOOKINGS ACTIONS
// =====================================================

export async function getBookings() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("bookings" as any)
    .select(`
      *,
      treatment:treatments(title)
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
  
  return data || [];
}

type CreateBookingPayload = {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  city: string;
  address: string;
  pin_code: string;
  treatment_slug: string;
  preferred_date: string;
  referral_code?: string;
  notes?: string;
};

const COMMISSION_RATE = 6;

function clean(value?: string) {
  return value?.trim() || "";
}

async function findPartnerByCode(supabase: ReturnType<typeof getSupabaseServiceClient>, code: string) {
  if (!code) return null;
  const { data } = await supabase
    .from("partners" as any)
    .select("id, partner_code, status, membership_expires_at, kyc_status, bank_verified")
    .eq("partner_code", code.toUpperCase())
    .maybeSingle();
  return data as any;
}

function isMembershipActive(partner: any) {
  if (!partner || partner.status !== "active") return false;
  if (!partner.membership_expires_at) return true;
  return new Date(partner.membership_expires_at).getTime() >= Date.now();
}

export async function createBooking(payload: CreateBookingPayload) {
  const serviceClient = getSupabaseServiceClient();

  const customerName = clean(payload.customer_name);
  const customerPhone = clean(payload.customer_phone);
  const city = clean(payload.city);
  const address = clean(payload.address);
  const pinCode = clean(payload.pin_code);
  const treatmentSlug = clean(payload.treatment_slug);
  const preferredDate = clean(payload.preferred_date);
  const referralCode =
    clean(payload.referral_code) ||
    clean(cookies().get("ozo_referral_code")?.value);

  if (!customerName) return { error: "Please enter your full name." };
  if (!/^[0-9+\-\s]{10,15}$/.test(customerPhone)) return { error: "Please enter a valid mobile number." };
  if (!city) return { error: "Please enter your city." };
  if (!address) return { error: "Please enter your address." };
  if (!pinCode) return { error: "Please enter your pin code." };
  if (!treatmentSlug) return { error: "Please select a treatment." };
  if (!preferredDate) return { error: "Please pick a preferred date." };

  const { data: treatment, error: treatmentError } = await serviceClient
    .from("treatments" as any)
    .select("id, title, kit_name, price, price_label, type")
    .eq("slug", treatmentSlug)
    .eq("active", true)
    .maybeSingle();

  if (treatmentError || !treatment) {
    return { error: "Selected treatment is not available." };
  }

  const partner = await findPartnerByCode(serviceClient, referralCode);
  const partnerIsEligible = isMembershipActive(partner);
  const treatmentPrice = Number((treatment as any).price || 0);
  const commissionAmount = partnerIsEligible ? Math.round((treatmentPrice * COMMISSION_RATE) / 100) : 0;

  const { data: booking, error: bookingError } = await serviceClient
    .from("bookings" as any)
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: clean(payload.customer_email) || null,
      city,
      address,
      pin_code: pinCode,
      treatment_id: (treatment as any).id,
      treatment_name: (treatment as any).title,
      treatment_price: treatmentPrice,
      booking_type: (treatment as any).type === "home_kit" ? "home_kit" : "consultation",
      preferred_date: preferredDate,
      referral_code: referralCode || null,
      partner_code: partner?.partner_code || (referralCode ? referralCode.toUpperCase() : null),
      referred_by: partnerIsEligible ? partner.id : null,
      payment_status: "pending_payment",
      booking_status: "pending",
      payment_amount: treatmentPrice,
      notes: clean(payload.notes) || null,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Error creating booking:", bookingError);
    return { error: bookingError?.message || "Failed to create booking." };
  }

  let commissionId: string | null = null;
  if (partnerIsEligible && commissionAmount > 0) {
    const { data: commission, error: commissionError } = await serviceClient
      .from("commissions" as any)
      .insert({
        partner_id: partner.id,
        source_type: "booking",
        source_id: (booking as any).id,
        source_amount: treatmentPrice,
        level: 1,
        percentage: COMMISSION_RATE,
        amount: commissionAmount,
        status: "pending",
      })
      .select("id")
      .single();

    if (!commissionError && commission) {
      commissionId = (commission as any).id;
    } else {
      console.error("Error creating commission:", commissionError);
    }
  }

  if (partner) {
    const { error: saleError } = await serviceClient.from("partner_sales" as any).insert({
      partner_id: partner.id,
      partner_code: partner.partner_code,
      treatment_id: (treatment as any).id,
      treatment_name: (treatment as any).title,
      kit_name: (treatment as any).kit_name || (treatment as any).title,
      treatment_price: treatmentPrice,
      booking_id: (booking as any).id,
      customer_name: customerName,
      customer_phone: customerPhone,
      booking_status: "pending",
      commission_amount: commissionAmount,
      commission_id: commissionId,
    });

    if (saleError) console.error("Error creating partner sale:", saleError);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/partner/dashboard");
  return { data: { booking_id: (booking as any).id } };
}

export async function getBookingById(id: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("bookings" as any)
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error fetching booking:", error);
    return null;
  }
  
  return data;
}

export async function updateBookingStatus(id: string, status: string, adminNote?: string) {
  const supabase = getSupabaseServerClient();
  
  const updateData: any = { booking_status: status, updated_at: new Date().toISOString() };
  if (adminNote) {
    updateData.admin_notes = adminNote;
  }
  
  const { data, error } = await supabase
    .from("bookings" as any)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
  
  revalidatePath("/admin/bookings");
  return data;
}

export async function deleteBooking(id: string) {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from("bookings" as any)
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
  
  revalidatePath("/admin/bookings");
  return { success: true };
}
