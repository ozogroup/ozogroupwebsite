"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function getPayments() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      bookings:bookings(customer_name, customer_phone)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return [];
  }

  return data;
}

export async function updatePaymentStatus(id: string, status: "created" | "authorized" | "captured" | "refunded" | "failed") {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

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
