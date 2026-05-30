"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function submitFranchiseLead(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const currentBusiness = String(formData.get("current_business") || "").trim();
  const investmentBudget = String(formData.get("investment_budget") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!fullName || !mobile || !city) {
    return { success: false, error: "Please fill Full Name, Mobile Number, and City." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("franchise_leads" as any).insert({
    full_name: fullName,
    mobile,
    city,
    current_business: currentBusiness || null,
    investment_budget: investmentBudget || null,
    message: message || null,
    status: "new",
  });

  if (error) {
    console.error("Error submitting franchise lead:", error);
    return { success: false, error: "Unable to submit inquiry. Please try again." };
  }

  return { success: true };
}
