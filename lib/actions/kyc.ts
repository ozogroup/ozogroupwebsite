"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const KYC_BUCKET = "kyc-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function value(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) || "").trim();
}

function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function uploadKycFile(partnerId: string, file: File | null, label: string) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) throw new Error(`${label} must be 10MB or smaller.`);
  if (!ALLOWED_TYPES.has(file.type)) throw new Error(`${label} must be JPG, PNG, WebP, or PDF.`);

  const supabase = getSupabaseServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${partnerId}/${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(KYC_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function submitPartnerKyc(formData: FormData) {
  const profile = await requirePartner();
  const supabase = getSupabaseServiceClient();

  const accountNumber = value(formData, "account_number");
  const confirmAccountNumber = value(formData, "confirm_account_number");
  const mobileNumber = normalizeMobile(value(formData, "mobile_number"));
  const upiMobile = normalizeMobile(value(formData, "upi_mobile"));
  const bankIfsc = value(formData, "bank_ifsc").toUpperCase();
  const upiId = value(formData, "upi_id").toLowerCase();

  if (accountNumber !== confirmAccountNumber) {
    redirect("/partner/kyc?error=Account numbers do not match");
  }

  const required = [
    "full_name",
    "mobile_number",
    "email",
    "account_holder_name",
    "bank_name",
    "account_number",
    "bank_ifsc",
  ];

  for (const key of required) {
    if (!value(formData, key)) {
      redirect(`/partner/kyc?error=${encodeURIComponent("Please complete all required fields")}`);
    }
  }

  if (!/^\d{10}$/.test(mobileNumber)) {
    redirect(`/partner/kyc?error=${encodeURIComponent("Enter a valid 10 digit mobile number")}`);
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
    redirect(`/partner/kyc?error=${encodeURIComponent("Enter a valid IFSC code")}`);
  }

  if (upiMobile && !/^\d{10}$/.test(upiMobile)) {
    redirect(`/partner/kyc?error=${encodeURIComponent("Enter a valid 10 digit UPI mobile number")}`);
  }

  if (upiId && !/^[a-z0-9._-]+@[a-z0-9.-]+$/i.test(upiId)) {
    redirect(`/partner/kyc?error=${encodeURIComponent("Enter a valid UPI ID")}`);
  }

  try {
    await Promise.all([
      uploadKycFile(profile.id, formData.get("pan_card") as File | null, "PAN Card"),
      uploadKycFile(profile.id, formData.get("aadhaar_front") as File | null, "Aadhaar Front"),
      uploadKycFile(profile.id, formData.get("aadhaar_back") as File | null, "Aadhaar Back"),
    ]);

    await supabase
      .from("partners" as any)
      .update({
        kyc_status: "pending",
        bank_account_holder: value(formData, "account_holder_name"),
        bank_account_number: accountNumber,
        bank_ifsc: bankIfsc,
        bank_name: value(formData, "bank_name"),
        upi_id: upiId || null,
        bank_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  } catch (e: any) {
    console.error("KYC submission failed:", e);
    redirect(`/partner/kyc?error=${encodeURIComponent("KYC submission failed. Please check your details and try again.")}`);
  }

  revalidatePath("/partner/kyc");
  redirect("/partner/kyc?success=KYC submitted for admin review");
}

export async function getPartnerKycStatus() {
  const profile = await requirePartner();
  const supabase = getSupabaseServiceClient();

  const { data: partner } = await supabase.from("partners" as any).select("*").eq("id", profile.id).single();

  return { partner: partner as any, kyc: null, profile };
}

async function signedUrl(path?: string | null) {
  if (!path) return null;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl || null;
}

export async function getKycSubmissions() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("partners" as any)
    .select("id, partner_code, status, kyc_status, bank_verified, bank_account_holder, bank_account_number, bank_ifsc, bank_name, upi_id, created_at, updated_at, profiles(full_name,email,phone)")
    .neq("kyc_status", "not_submitted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching KYC submissions:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    partner_id: row.id,
    full_name: row.profiles?.full_name,
    mobile_number: row.profiles?.phone,
    email: row.profiles?.email,
    account_holder_name: row.bank_account_holder,
    bank_name: row.bank_name,
    account_number: row.bank_account_number,
    bank_ifsc: row.bank_ifsc,
    upi_id: row.upi_id,
    status: row.kyc_status,
    created_at: row.updated_at || row.created_at,
    partner: {
      partner_code: row.partner_code,
      status: row.status,
      profiles: row.profiles,
    },
  }));
}

export async function reviewKycSubmission(id: string, status: "verified" | "rejected" | "pending", reason?: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const now = new Date().toISOString();
  const rejectionReason = status === "rejected" ? reason?.trim() || "Please resubmit clearer/valid documents." : null;

  const { error } = await supabase
    .from("partners" as any)
    .update({
      kyc_status: status,
      bank_verified: status === "verified",
      payout_hold_reason: status === "verified" ? null : rejectionReason,
      updated_at: now,
    })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/admin/kyc");
  revalidatePath("/partner/kyc");
}
