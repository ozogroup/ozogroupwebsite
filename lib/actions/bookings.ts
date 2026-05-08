"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// =====================================================
// BOOKINGS ACTIONS
// =====================================================

export async function getBookings() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("bookings" as any)
    .select(`
      *,
      treatment:treatments(name)
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
  
  return data || [];
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
  
  const updateData: any = { status, updated_at: new Date().toISOString() };
  if (adminNote) {
    updateData.admin_note = adminNote;
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
