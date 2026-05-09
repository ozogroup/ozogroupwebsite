"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getPayments() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      bookings:bookings(customer_name, customer_phone, preferred_date)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return [];
  }

  return data;
}

export async function updatePaymentStatus(id: string, status: "created" | "authorized" | "captured" | "refunded" | "failed") {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("payments")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating payment status:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
  
  return { data };
}
