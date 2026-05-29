"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  getBookingTreatmentCatalogItem,
  getBookingTreatmentSlugCandidates,
} from "@/lib/treatments/catalog";
import { generateBookingCommissions } from "@/lib/actions/referral-tracking";
import { normalizeKiaPartnerCode } from "@/lib/partner-code";

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

async function getCurrentPartnerCode(serviceClient: ReturnType<typeof getSupabaseServiceClient>) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "";

  const { data } = await serviceClient
    .from("partners" as any)
    .select("partner_code")
    .eq("id", user.id)
    .maybeSingle();

  return normalizeKiaPartnerCode((data as any)?.partner_code);
}

function isMembershipActive(partner: any) {
  if (!partner || partner.status !== "active") return false;
  if (!partner.membership_expires_at) return true;
  return new Date(partner.membership_expires_at).getTime() >= Date.now();
}

function toBookingTreatment(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    kitName: row.kit_name || row.title,
    price: Number(row.price || 0),
    priceLabel: row.price_label || `Rs. ${Number(row.price || 0).toLocaleString("en-IN")}`,
    type: row.type || row.treatment_type || "home_kit",
    slug: row.slug,
  };
}

async function findActiveTreatment(
  serviceClient: ReturnType<typeof getSupabaseServiceClient>,
  treatmentSlugCandidates: string[]
) {
  const baseQuery = () =>
    serviceClient
      .from("treatments" as any)
      .select("*")
      .in("slug", treatmentSlugCandidates)
      .is("deleted_at", null)
      .limit(1);

  const { data: rows, error } = await baseQuery().eq("active", true);

  if (error) {
    console.error("Error resolving active treatment:", error);
    return null;
  }

  if (Array.isArray(rows) && rows[0]) return toBookingTreatment(rows[0]);

  const { data: fallbackRows, error: fallbackError } = await baseQuery().eq("is_active", true);
  if (fallbackError) {
    console.error("Error resolving is_active treatment:", fallbackError);
    return null;
  }

  return toBookingTreatment(Array.isArray(fallbackRows) ? fallbackRows[0] : null);
}

async function restoreCatalogTreatment(
  serviceClient: ReturnType<typeof getSupabaseServiceClient>,
  requestedTreatmentSlug: string
) {
  const catalogItem = getBookingTreatmentCatalogItem(requestedTreatmentSlug);
  if (!catalogItem) return null;

  const slug = catalogItem.slug;
  const payload = {
    title: catalogItem.title,
    slug,
    price: catalogItem.price,
    price_label: catalogItem.priceLabel,
    unit: catalogItem.unit,
    type: catalogItem.type,
    active: true,
    is_active: true,
    deleted_at: null,
    tagline: catalogItem.tagline,
    subtitle: catalogItem.subtitle,
    description: catalogItem.description,
    duration: catalogItem.duration,
    sessions: catalogItem.sessions,
    image: catalogItem.image,
    image_alt: catalogItem.imageAlt,
    requires_slots: catalogItem.requiresSlots,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await serviceClient
    .from("treatments" as any)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking catalog treatment fallback:", existingError);
    return null;
  }

  const query = existing
    ? serviceClient.from("treatments" as any).update(payload).eq("id", (existing as any).id)
    : serviceClient.from("treatments" as any).insert(payload);

  const { data, error } = await query.select("*").single();

  if (error) {
    console.error("Error restoring catalog treatment fallback:", error);
    return null;
  }

  return toBookingTreatment(data);
}

export async function createBooking(payload: CreateBookingPayload) {
  const serviceClient = getSupabaseServiceClient();

  const customerName = clean(payload.customer_name);
  const customerPhone = clean(payload.customer_phone);
  const city = clean(payload.city);
  const address = clean(payload.address);
  const pinCode = clean(payload.pin_code);
  const requestedTreatmentSlug = clean(payload.treatment_slug);
  let referralCode = normalizeKiaPartnerCode(
    clean(payload.referral_code) ||
    clean(cookies().get("kia_referral_code")?.value) ||
    clean(cookies().get("ozo_referral_code")?.value)
  );

  if (!customerName) return { error: "Please enter your full name." };
  if (!/^[0-9+\-\s]{10,15}$/.test(customerPhone)) return { error: "Please enter a valid mobile number." };
  if (!city) return { error: "Please enter your city." };
  if (!address) return { error: "Please enter your address." };
  if (!pinCode) return { error: "Please enter your pin code." };
  if (!requestedTreatmentSlug) return { error: "Please select a service or kit before booking." };

  const treatmentSlugCandidates = getBookingTreatmentSlugCandidates(requestedTreatmentSlug);

  const treatment =
    (await findActiveTreatment(serviceClient, treatmentSlugCandidates)) ||
    (await restoreCatalogTreatment(serviceClient, requestedTreatmentSlug));

  if (!treatment) {
    return { error: "Selected treatment is not available." };
  }

  if (!referralCode) {
    referralCode = await getCurrentPartnerCode(serviceClient);
  }

  const partner = await findPartnerByCode(serviceClient, referralCode);
  const partnerIsEligible = isMembershipActive(partner);
  const treatmentPrice = Number(treatment.price || 0);
  const treatmentType = treatment.type;
  const commissionAmount = partnerIsEligible ? Math.round((treatmentPrice * COMMISSION_RATE) / 100) : 0;

  const bookingPayload: Record<string, unknown> = {
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: clean(payload.customer_email) || null,
    city,
    address,
    pin_code: pinCode,
    treatment_id: treatment.id,
    treatment_name: treatment.title,
    treatment_price: treatmentPrice,
    booking_type:
      treatmentType === "home_kit"
        ? "home_kit"
        : treatmentType === "campaign"
          ? "campaign"
          : "consultation",
    referral_code: referralCode || null,
    partner_code: partner?.partner_code || (referralCode ? referralCode.toUpperCase() : null),
    referred_by: partnerIsEligible ? partner.id : null,
    payment_status: "pending_payment",
    payment_gateway: "manual",
    razorpay_order_id: null,
    razorpay_payment_id: null,
    booking_status: "pending",
    payment_amount: treatmentPrice,
    notes: clean(payload.notes) || null,
  };

  let bookingResult = await serviceClient
    .from("bookings" as any)
    .insert(bookingPayload)
    .select("id")
    .single();

  if (
    bookingResult.error &&
    /payment_gateway|razorpay_order_id|razorpay_payment_id/i.test(bookingResult.error.message || "")
  ) {
    const fallbackPayload = { ...bookingPayload };
    delete fallbackPayload.payment_gateway;
    delete fallbackPayload.razorpay_order_id;
    delete fallbackPayload.razorpay_payment_id;
    bookingResult = await serviceClient
      .from("bookings" as any)
      .insert(fallbackPayload)
      .select("id")
      .single();
  }

  const { data: booking, error: bookingError } = bookingResult;

  if (bookingError || !booking) {
    console.error("Error creating booking:", bookingError);
    return { error: "Failed to create booking. Please try again or contact us on WhatsApp." };
  }

  if (partner) {
    const { error: saleError } = await serviceClient.from("partner_sales" as any).insert({
      partner_id: partner.id,
      partner_code: partner.partner_code,
      treatment_name: treatment.title,
      treatment_price: treatmentPrice,
      booking_id: (booking as any).id,
      customer_name: customerName,
      customer_phone: customerPhone,
      booking_status: "pending",
      commission_amount: commissionAmount,
    });

    if (saleError) console.error("Error creating partner sale:", saleError);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/partner/dashboard");
  return { data: { booking_id: (booking as any).id, message: "Booking request submitted successfully. Our team will contact you shortly." } };
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

  if (["confirmed", "completed"].includes(status)) {
    await generateBookingCommissions(supabase, {
      id: (data as any).id,
      referred_by: (data as any).referred_by,
      payment_amount:
        (data as any).payment_amount ?? (data as any).treatment_price ?? 0,
      booking_status: (data as any).booking_status,
    });
  }
  
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/commissions");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/commissions");
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
