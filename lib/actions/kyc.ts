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
    "branch_name",
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
    const existing = await supabase
      .from("partner_kyc" as any)
      .select("pan_card_path,aadhaar_front_path,aadhaar_back_path")
      .eq("partner_id", profile.id)
      .maybeSingle();

    const panPath =
      (await uploadKycFile(profile.id, formData.get("pan_card") as File | null, "PAN Card")) ||
      (existing.data as any)?.pan_card_path;
    const aadhaarFrontPath =
      (await uploadKycFile(profile.id, formData.get("aadhaar_front") as File | null, "Aadhaar Front")) ||
      (existing.data as any)?.aadhaar_front_path;
    const aadhaarBackPath =
      (await uploadKycFile(profile.id, formData.get("aadhaar_back") as File | null, "Aadhaar Back")) ||
      (existing.data as any)?.aadhaar_back_path;

    if (!panPath || !aadhaarFrontPath || !aadhaarBackPath) {
      redirect(`/partner/kyc?error=${encodeURIComponent("Please upload PAN and both Aadhaar images")}`);
    }

    const payload = {
      partner_id: profile.id,
      full_name: value(formData, "full_name"),
      mobile_number: mobileNumber,
      email: value(formData, "email"),
      account_holder_name: value(formData, "account_holder_name"),
      bank_name: value(formData, "bank_name"),
      account_number: accountNumber,
      bank_ifsc: bankIfsc,
      branch_name: value(formData, "branch_name"),
      upi_holder_name: value(formData, "upi_holder_name") || null,
      upi_mobile: upiMobile || null,
      upi_id: upiId || null,
      upi_app: value(formData, "upi_app") || null,
      pan_card_path: panPath,
      aadhaar_front_path: aadhaarFrontPath,
      aadhaar_back_path: aadhaarBackPath,
      status: "pending",
      rejection_reason: null,
    };

    const { error } = await supabase
      .from("partner_kyc" as any)
      .upsert(payload, { onConflict: "partner_id" });

    if (error) throw error;

    await supabase
      .from("partners" as any)
      .update({
        kyc_status: "pending",
        kyc_submitted_at: new Date().toISOString(),
        bank_account_holder: payload.account_holder_name,
        bank_account_number: payload.account_number,
        bank_ifsc: payload.bank_ifsc,
        bank_name: payload.bank_name,
        bank_branch_name: payload.branch_name,
        upi_holder_name: payload.upi_holder_name,
        upi_mobile: payload.upi_mobile,
        upi_id: payload.upi_id,
        upi_app: payload.upi_app,
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

  const [{ data: partner }, { data: kyc }] = await Promise.all([
    supabase.from("partners" as any).select("*").eq("id", profile.id).single(),
    supabase.from("partner_kyc" as any).select("*").eq("partner_id", profile.id).maybeSingle(),
  ]);

  return { partner: partner as any, kyc: kyc as any, profile };
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
    .from("partner_kyc" as any)
    .select("*, partner:partners(partner_code,status,profiles(full_name,email,phone))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching KYC submissions:", error);
    return [];
  }

  return Promise.all(
    (data || []).map(async (row: any) => ({
      ...row,
      pan_card_url: await signedUrl(row.pan_card_path),
      aadhaar_front_url: await signedUrl(row.aadhaar_front_path),
      aadhaar_back_url: await signedUrl(row.aadhaar_back_path),
    }))
  );
}

export async function reviewKycSubmission(id: string, status: "verified" | "rejected" | "pending", reason?: string) {
  const admin = await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data: kyc, error: fetchError } = await supabase
    .from("partner_kyc" as any)
    .select("partner_id")
    .eq("id", id)
    .single();

  if (fetchError || !kyc) throw new Error("KYC submission not found");

  const now = new Date().toISOString();
  const rejectionReason = status === "rejected" ? reason?.trim() || "Please resubmit clearer/valid documents." : null;

  const { error } = await supabase
    .from("partner_kyc" as any)
    .update({
      status,
      rejection_reason: rejectionReason,
      reviewed_by: admin.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) throw error;

  await supabase
    .from("partners" as any)
    .update({
      kyc_status: status,
      kyc_reviewed_at: now,
      kyc_rejection_reason: rejectionReason,
      bank_verified: status === "verified",
      payout_hold_reason: status === "verified" ? null : rejectionReason,
      updated_at: now,
    })
    .eq("id", (kyc as any).partner_id);

  revalidatePath("/admin/kyc");
  revalidatePath("/partner/kyc");
}
