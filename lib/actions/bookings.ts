"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { generateBookingCommissions, resolvePartnerByCode } from "@/lib/actions/referral-tracking";

// =====================================================
// BOOKINGS ACTIONS
// =====================================================

export async function getBookings() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("bookings" as any)
    .select(`
      *,
      treatment:treatments(title),
      referred_partner:partners!bookings_referred_by_fkey(partner_code, status, profiles(full_name, phone, email))
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching bookings with partner details:", error);
    const fallback = await supabase
      .from("bookings" as any)
      .select(`
        *,
        treatment:treatments(title),
        referred_partner:partners!bookings_referred_by_fkey(partner_code, status)
      `)
      .order("created_at", { ascending: false });

    if (fallback.error) {
      console.error("Error fetching bookings:", fallback.error);
      return [];
    }

    return fallback.data || [];
  }
  
  return data || [];
}

export async function createBooking(data: {
  fullName: string;
  mobile: string;
  email?: string;
  city: string;
  address: string;
  pinCode: string;
  treatment: string;
  date: string;
  time: string;
  referralCode?: string;
  message?: string;
}) {
  if (!data.fullName?.trim()) return { error: "Full name is required" };
  if (!data.mobile?.trim()) return { error: "Mobile number is required" };
  if (!data.city?.trim()) return { error: "City is required" };
  if (!data.address?.trim()) return { error: "Address is required" };
  if (!data.pinCode?.trim()) return { error: "Pin code is required" };
  if (!data.treatment?.trim()) return { error: "Treatment is required" };
  if (!data.date?.trim()) return { error: "Preferred date is required" };
  if (!data.time?.trim()) return { error: "Preferred time is required" };

  const mobileRegex = /^[0-9+\-\s()]{7,15}$/;
  if (!mobileRegex.test(data.mobile.trim())) return { error: "Invalid mobile number" };

  const email = data.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email format" };
  }

  const supabase = getSupabaseServiceClient();
  const treatmentSlug = data.treatment.trim();
  const referralCode = data.referralCode?.trim().toUpperCase() || null;

  const { data: treatment, error: treatmentError } = await supabase
    .from("treatments" as any)
    .select("id, price, slug")
    .eq("slug", treatmentSlug)
    .maybeSingle();

  if (treatmentError) {
    console.error("Error fetching treatment for booking:", treatmentError);
    return { error: "Selected treatment is unavailable. Please try again." };
  }

  if (!treatment) {
    return { error: "Selected treatment is unavailable. Please choose another treatment." };
  }

  const partner = await resolvePartnerByCode(supabase, referralCode);

  const { data: booking, error } = await supabase
    .from("bookings" as any)
    .insert({
      customer_name: data.fullName.trim(),
      customer_phone: data.mobile.trim(),
      customer_email: email || null,
      city: data.city.trim(),
      address: data.address.trim(),
      pin_code: data.pinCode.trim(),
      treatment_id: (treatment as any).id,
      booking_type: "consultation",
      preferred_date: data.date,
      preferred_time: data.time,
      referral_code: referralCode,
      referred_by: (partner as any)?.id || null,
      payment_status: "pending_payment",
      booking_status: "pending",
      payment_amount: Number((treatment as any).price ?? 0) || null,
      notes: data.message?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating booking:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/bookings");
  return { data: booking };
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
  const supabase = getSupabaseServiceClient();
  
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
    await generateBookingCommissions(supabase, data as any);
  }
  
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/partners");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/income");
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
