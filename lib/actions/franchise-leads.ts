"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

const franchiseLeadSelect =
  "id,full_name,mobile,city,current_business,investment_budget,message,status,created_at";

function formatSupabaseError(action: string, error: any) {
  return `Supabase ${action} failed${error?.code ? ` (${error.code})` : ""}: ${error?.message || "Unknown error"}${error?.details ? ` Details: ${error.details}` : ""}${error?.hint ? ` Hint: ${error.hint}` : ""}`;
}

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

  try {
    const supabase = getSupabaseServiceClient();
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
      const message = formatSupabaseError("franchise lead insert", error);
      console.error("[FRANCHISE_LEAD_INSERT_ERROR]", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error: any) {
    const message = `Franchise lead insert failed before Supabase request: ${error?.message || "Unknown error"}`;
    console.error("[FRANCHISE_LEAD_INSERT_EXCEPTION]", message);
    return { success: false, error: message };
  }
}

export async function getFranchiseLeads() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("franchise_leads" as any)
      .select(franchiseLeadSelect)
      .order("created_at", { ascending: false });

    if (error) {
      const message = formatSupabaseError("franchise leads read", error);
      console.error("[FRANCHISE_LEADS_READ_ERROR]", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: message, data: [] };
    }

    return { success: true, data: (data || []) as any[] };
  } catch (error: any) {
    const message = `Franchise leads read failed before Supabase request: ${error?.message || "Unknown error"}`;
    console.error("[FRANCHISE_LEADS_READ_EXCEPTION]", message);
    return { success: false, error: message, data: [] };
  }
}

export async function updateFranchiseLead(input: { id: string; status: string; adminNote?: string }) {
  try {
    const supabase = getSupabaseServiceClient();
    const payload: Record<string, string> = { status: input.status };
    if (input.adminNote?.trim()) payload.admin_note = input.adminNote.trim();

    let result = await supabase.from("franchise_leads" as any).update(payload).eq("id", input.id);

    if (result.error && "admin_note" in payload) {
      result = await supabase.from("franchise_leads" as any).update({ status: input.status }).eq("id", input.id);
    }

    if (result.error) {
      const message = formatSupabaseError("franchise lead update", result.error);
      console.error("[FRANCHISE_LEAD_UPDATE_ERROR]", {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
      });
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error: any) {
    const message = `Franchise lead update failed before Supabase request: ${error?.message || "Unknown error"}`;
    console.error("[FRANCHISE_LEAD_UPDATE_EXCEPTION]", message);
    return { success: false, error: message };
  }
}
