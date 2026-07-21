"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { syncKycSubmitted } from "@/lib/integrations/google-sheet-sync";

const KYC_BUCKET = "partner-kyc-private";
const LEGACY_KYC_BUCKET = "kyc-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

type ReviewStatus = "verified" | "rejected" | "pending" | "under_review" | "resubmission_required";
type KycResult = { success: boolean; error?: string };

function value(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) || "").trim();
}

function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeUpi(input: string) {
  return input.trim().replace(/\s+/g, "").toLowerCase();
}

function normalizePan(input: string) {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeAccount(input: string) {
  return input.replace(/\s+/g, "");
}

function maskAccount(input?: string | null) {
  const clean = normalizeAccount(input || "");
  if (!clean) return null;
  return `XXXX${clean.slice(-4)}`;
}

function maskUpi(input?: string | null) {
  const clean = normalizeUpi(input || "");
  const [name, handle] = clean.split("@");
  if (!name || !handle) return clean || null;
  return `${name.slice(0, 2)}***@${handle}`;
}

function profileFrom(row: any) {
  return Array.isArray(row?.profiles) ? row.profiles[0] : row?.profiles;
}

async function ensureBucketExists(supabase: any) {
  const { data } = await supabase.storage.getBucket(KYC_BUCKET);
  if (data) return true;
  const { error } = await supabase.storage.createBucket(KYC_BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });
  return !error;
}

async function uploadKycFile(partnerId: string, file: File | null, documentType: string, version: number) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) throw new Error(`${documentType} must be 10MB or smaller.`);
  if (!ALLOWED_TYPES.has(file.type)) throw new Error(`${documentType} must be JPG, PNG, WebP, or PDF.`);

  const supabase = getSupabaseServiceClient();
  await ensureBucketExists(supabase);

  const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
  const safeType = documentType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const path = `partners/${partnerId}/${safeType}/${version}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(KYC_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed for ${documentType}: ${error.message}`);
  return { path, mimeType: file.type, fileSize: file.size };
}

async function createSignedUrl(path?: string | null) {
  if (!path) return null;
  const supabase = getSupabaseServiceClient();
  const bucket = path.startsWith("partners/") ? KYC_BUCKET : LEGACY_KYC_BUCKET;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data?.signedUrl || null;
}

async function upsertDocumentRow(input: {
  partnerId: string;
  kycId?: string | null;
  documentType: string;
  upload: { path: string; mimeType: string; fileSize: number } | null;
  version: number;
}) {
  if (!input.upload) return;
  const supabase = getSupabaseServiceClient();
  await supabase.from("partner_kyc_documents" as any).upsert(
    {
      partner_id: input.partnerId,
      kyc_id: input.kycId || null,
      document_type: input.documentType,
      storage_path: input.upload.path,
      mime_type: input.upload.mimeType,
      file_size: input.upload.fileSize,
      version: input.version,
      status: "submitted",
      uploaded_at: new Date().toISOString(),
    },
    { onConflict: "partner_id,document_type,version" }
  );
}

export async function submitPartnerKyc(formData: FormData): Promise<KycResult> {
  let profile: any;
  try {
    profile = await requirePartner();
  } catch {
    return { success: false, error: "Please log in to submit KYC." };
  }

  const supabase = getSupabaseServiceClient();

  let existingKycRow: any = null;
  try {
    const { data } = await supabase
      .from("partner_kyc" as any)
      .select("*")
      .eq("partner_id", profile.id)
      .maybeSingle();
    existingKycRow = data as any;
  } catch {
    // partner_kyc table may not exist yet — proceed without it
  }

  const method = value(formData, "payment_method") === "upi" ? "upi" : "bank";
  const mobileNumber = normalizeMobile(value(formData, "mobile_number"));
  const registeredMobile = normalizeMobile(value(formData, "registered_mobile") || value(formData, "mobile_number"));
  const accountNumber = normalizeAccount(value(formData, "account_number"));
  const confirmAccountNumber = normalizeAccount(value(formData, "confirm_account_number"));
  const bankIfsc = value(formData, "bank_ifsc").toUpperCase().replace(/\s+/g, "");
  const upiId = normalizeUpi(value(formData, "upi_id"));
  const confirmUpiId = normalizeUpi(value(formData, "confirm_upi_id"));
  const panNumber = normalizePan(value(formData, "pan_number"));

  if (!value(formData, "full_name") || !mobileNumber || !value(formData, "email")) {
    return { success: false, error: "Please complete personal details (name, mobile, email)." };
  }
  if (!/^\d{10}$/.test(mobileNumber)) {
    return { success: false, error: "Enter a valid 10-digit mobile number." };
  }
  if (registeredMobile && !/^\d{10}$/.test(registeredMobile)) {
    return { success: false, error: "Enter a valid 10-digit registered mobile number." };
  }
  if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
    return { success: false, error: "Enter a valid PAN number (e.g. ABCDE1234F)." };
  }

  if (method === "bank") {
    if (!value(formData, "account_holder_name") || !value(formData, "bank_name") || !accountNumber || !bankIfsc) {
      return { success: false, error: "Please complete all bank account fields (holder name, bank name, account number, IFSC)." };
    }
    if (accountNumber !== confirmAccountNumber) {
      return { success: false, error: "Account numbers do not match." };
    }
    if (!/^[0-9]{9,18}$/.test(accountNumber)) {
      return { success: false, error: "Enter a valid bank account number (9-18 digits)." };
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
      return { success: false, error: "Enter a valid IFSC code (e.g. SBIN0001234)." };
    }
  }

  if (method === "upi") {
    if (!value(formData, "upi_holder_name") || !upiId) {
      return { success: false, error: "Please complete all UPI fields (holder name, UPI ID)." };
    }
    if (upiId !== confirmUpiId) {
      return { success: false, error: "UPI IDs do not match." };
    }
    if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(upiId)) {
      return { success: false, error: "Enter a valid UPI ID (e.g. name@bank)." };
    }
  }

  // Duplicate submission guard: reject if submitted within last 30 seconds
  if (existingKycRow?.submitted_at) {
    const lastSubmit = new Date(existingKycRow.submitted_at).getTime();
    if (Date.now() - lastSubmit < 30_000) {
      return { success: false, error: "KYC was already submitted moments ago. Please wait before resubmitting." };
    }
  }

  const currentVersion = Number(existingKycRow?.current_version || 0) + 1;
  const panFile = formData.get("pan_card") as File | null;
  const aadhaarFrontFile = formData.get("aadhaar_front") as File | null;
  const aadhaarBackFile = formData.get("aadhaar_back") as File | null;
  const selfieFile = formData.get("selfie") as File | null;
  const hasPan = Boolean(panFile?.size || existingKycRow?.pan_card_path);
  const hasAadhaar = Boolean(aadhaarFrontFile?.size || existingKycRow?.aadhaar_front_path);
  const hasSelfie = Boolean(selfieFile?.size || existingKycRow?.selfie_path);

  if (!hasPan || !hasAadhaar || !hasSelfie) {
    return { success: false, error: "PAN card, Aadhaar front, and selfie are required documents." };
  }

  try {
    const [panUpload, aadhaarFrontUpload, aadhaarBackUpload, selfieUpload] = await Promise.all([
      uploadKycFile(profile.id, panFile, "pan-card", currentVersion),
      uploadKycFile(profile.id, aadhaarFrontFile, "aadhaar-front", currentVersion),
      uploadKycFile(profile.id, aadhaarBackFile, "aadhaar-back", currentVersion),
      uploadKycFile(profile.id, selfieFile, "selfie", currentVersion),
    ]);

    // Try to save in partner_kyc table (may not exist if migration not run)
    let savedKycId: string | null = null;
    try {
      const payload: Record<string, unknown> = {
        partner_id: profile.id,
        full_name: value(formData, "full_name"),
        mobile_number: mobileNumber,
        email: value(formData, "email").toLowerCase(),
        payment_method: method,
        account_holder_name: method === "bank" ? value(formData, "account_holder_name") : null,
        bank_name: method === "bank" ? value(formData, "bank_name") : null,
        account_number: method === "bank" ? accountNumber : null,
        account_last4: method === "bank" ? accountNumber.slice(-4) : null,
        bank_ifsc: method === "bank" ? bankIfsc : null,
        branch_name: method === "bank" ? value(formData, "branch_name") : null,
        upi_id: method === "upi" ? upiId : null,
        upi_holder_name: method === "upi" ? value(formData, "upi_holder_name") : null,
        upi_mobile: method === "upi" ? registeredMobile : null,
        registered_mobile: registeredMobile,
        pan_number: panNumber || null,
        pan_card_path: panUpload?.path || existingKycRow?.pan_card_path || null,
        aadhaar_front_path: aadhaarFrontUpload?.path || existingKycRow?.aadhaar_front_path || null,
        aadhaar_back_path: aadhaarBackUpload?.path || existingKycRow?.aadhaar_back_path || null,
        selfie_path: selfieUpload?.path || existingKycRow?.selfie_path || null,
        status: "pending",
        rejection_reason: null,
        resubmission_reason: null,
        submitted_at: new Date().toISOString(),
        current_version: currentVersion,
        updated_at: new Date().toISOString(),
      };

      const { data: kycRow, error: upsertError } = await supabase
        .from("partner_kyc" as any)
        .upsert(payload, { onConflict: "partner_id" })
        .select("id")
        .single();

      if (upsertError) {
        console.error("partner_kyc upsert failed (falling back to partners-only):", upsertError.message);
      } else {
        savedKycId = (kycRow as any)?.id || null;
      }
    } catch (kycTableError: any) {
      console.error("partner_kyc table unavailable (falling back to partners-only):", kycTableError?.message);
    }

    if (savedKycId) {
      await Promise.all([
        upsertDocumentRow({ partnerId: profile.id, kycId: savedKycId, documentType: "pan_card", upload: panUpload, version: currentVersion }),
        upsertDocumentRow({ partnerId: profile.id, kycId: savedKycId, documentType: "aadhaar_front", upload: aadhaarFrontUpload, version: currentVersion }),
        upsertDocumentRow({ partnerId: profile.id, kycId: savedKycId, documentType: "aadhaar_back", upload: aadhaarBackUpload, version: currentVersion }),
        upsertDocumentRow({ partnerId: profile.id, kycId: savedKycId, documentType: "selfie", upload: selfieUpload, version: currentVersion }),
      ]).catch((docErr) => {
        console.error("Document row save failed (non-fatal):", docErr?.message);
      });
    }

    // Always update the partners table (core columns that exist since launch)
    const partnerUpdate: Record<string, unknown> = {
      kyc_status: "pending",
      bank_account_holder: method === "bank" ? value(formData, "account_holder_name") : null,
      bank_account_number: method === "bank" ? accountNumber : null,
      bank_ifsc: method === "bank" ? bankIfsc : null,
      upi_id: method === "upi" ? upiId : null,
      pan_number: panNumber || null,
      bank_verified: false,
      payout_hold_reason: null,
      updated_at: new Date().toISOString(),
    };

    const { error: partnerError } = await supabase
      .from("partners" as any)
      .update(partnerUpdate)
      .eq("id", profile.id);

    if (partnerError) {
      console.error("Partner update failed:", partnerError.message);
      // Try a minimal update with only guaranteed columns
      await supabase
        .from("partners" as any)
        .update({
          kyc_status: "pending",
          bank_account_holder: method === "bank" ? value(formData, "account_holder_name") : null,
          bank_account_number: method === "bank" ? accountNumber : null,
          bank_ifsc: method === "bank" ? bankIfsc : null,
          upi_id: method === "upi" ? upiId : null,
          bank_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    }

    // Try setting migration-added columns separately (won't fail the whole flow)
    try {
      await supabase
        .from("partners" as any)
        .update({
          kyc_submitted_at: new Date().toISOString(),
          bank_name: method === "bank" ? value(formData, "bank_name") : null,
          bank_branch_name: method === "bank" ? value(formData, "branch_name") : null,
        })
        .eq("id", profile.id);
    } catch {
      // These columns may not exist if migration hasn't been run — non-fatal
    }
  } catch (e: any) {
    console.error("KYC submission failed:", e?.message || e);
    return { success: false, error: e?.message || "KYC submission failed. Please check your details and try again." };
  }

  // Sync KYC details to Google Sheet (non-blocking)
  try {
    const { data: partnerRow } = await supabase
      .from("partners" as any)
      .select("partner_code")
      .eq("id", profile.id)
      .maybeSingle();
    await syncKycSubmitted({
      partner_id: profile.id,
      partner_code: (partnerRow as any)?.partner_code || "",
      full_name: value(formData, "full_name"),
      email: value(formData, "email").toLowerCase(),
      phone: mobileNumber,
      payment_method: method,
      bank_account_holder: method === "bank" ? value(formData, "account_holder_name") : undefined,
      bank_account_number: method === "bank" ? accountNumber : undefined,
      bank_ifsc: method === "bank" ? bankIfsc : undefined,
      bank_name: method === "bank" ? value(formData, "bank_name") : undefined,
      bank_branch_name: method === "bank" ? value(formData, "branch_name") : undefined,
      upi_id: method === "upi" ? upiId : undefined,
      upi_holder_name: method === "upi" ? value(formData, "upi_holder_name") : undefined,
      submitted_at: new Date().toISOString(),
    });
  } catch (syncErr) {
    console.error("KYC Google Sheet sync failed (non-fatal):", syncErr);
  }

  revalidatePath("/partner/kyc");
  revalidatePath("/admin/kyc");
  return { success: true };
}

export async function getPartnerKycStatus(): Promise<{
  success: boolean;
  error?: string;
  partner?: any;
  kyc?: any;
  profile?: any;
  maskedAccount?: string | null;
  maskedUpi?: string | null;
}> {
  let profile: any;
  try {
    profile = await requirePartner();
  } catch {
    return { success: false, error: "Please log in as a partner to access KYC." };
  }

  const supabase = getSupabaseServiceClient();

  const { data: partner, error: partnerError } = await supabase
    .from("partners" as any)
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  if (partnerError || !partner) {
    return { success: false, error: "Could not load partner profile. Please try refreshing." };
  }

  let kyc: any = null;
  try {
    const { data } = await supabase.from("partner_kyc" as any).select("*").eq("partner_id", profile.id).maybeSingle();
    kyc = data as any;
  } catch {
    // table may not exist
  }

  return {
    success: true,
    partner: partner as any,
    kyc: kyc as any,
    profile: { id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role },
    maskedAccount: maskAccount((kyc as any)?.account_number || (partner as any)?.bank_account_number),
    maskedUpi: maskUpi((kyc as any)?.upi_id || (partner as any)?.upi_id),
  };
}

export async function getKycSubmissions() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  // Try to get from partner_kyc joined data first
  let hasKycTable = true;
  try {
    const { error: probeError } = await supabase
      .from("partner_kyc" as any)
      .select("id")
      .limit(0);
    if (probeError) hasKycTable = false;
  } catch {
    hasKycTable = false;
  }

  const { data, error } = await supabase
    .from("partners" as any)
    .select(
      hasKycTable
        ? `id, partner_code, status, kyc_status, bank_verified, bank_account_holder,
           bank_account_number, bank_ifsc, bank_name, bank_branch_name, upi_id,
           kyc_submitted_at, kyc_reviewed_at, payout_hold_reason, created_at, updated_at,
           profiles(full_name,email,phone),
           partner_kyc(*)`
        : `id, partner_code, status, kyc_status, bank_verified, bank_account_holder,
           bank_account_number, bank_ifsc, upi_id,
           payout_hold_reason, created_at, updated_at,
           profiles(full_name,email,phone)`
    )
    .neq("kyc_status", "not_submitted")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching KYC submissions:", error);
    return [];
  }

  return Promise.all((data || []).map(async (row: any) => {
    const profile = profileFrom(row);
    const kyc = Array.isArray(row.partner_kyc) ? row.partner_kyc[0] : row.partner_kyc;
    const paymentMethod = kyc?.payment_method || (row.upi_id ? "upi" : "bank");
    return {
      id: row.id,
      partner_id: row.id,
      kyc_id: kyc?.id || null,
      full_name: profile?.full_name || kyc?.full_name,
      mobile_number: profile?.phone || kyc?.mobile_number,
      email: profile?.email || kyc?.email,
      payment_method: paymentMethod,
      account_holder_name: kyc?.account_holder_name || row.bank_account_holder,
      bank_name: kyc?.bank_name || row.bank_name,
      masked_account_number: maskAccount(kyc?.account_number || row.bank_account_number),
      bank_ifsc: kyc?.bank_ifsc || row.bank_ifsc,
      branch_name: kyc?.branch_name || row.bank_branch_name,
      upi_holder_name: kyc?.upi_holder_name,
      upi_mobile: kyc?.upi_mobile || kyc?.registered_mobile,
      masked_upi_id: maskUpi(kyc?.upi_id || row.upi_id),
      status: row.kyc_status,
      kyc_status: row.kyc_status,
      partner_status: row.status,
      bank_verified: row.bank_verified,
      created_at: kyc?.submitted_at || row.kyc_submitted_at || row.updated_at || row.created_at,
      updated_at: row.updated_at,
      rejection_reason: kyc?.rejection_reason || row.payout_hold_reason,
      resubmission_reason: kyc?.resubmission_reason,
      pan_card_url: await createSignedUrl(kyc?.pan_card_path),
      aadhaar_front_url: await createSignedUrl(kyc?.aadhaar_front_path),
      aadhaar_back_url: await createSignedUrl(kyc?.aadhaar_back_path),
      selfie_url: await createSignedUrl(kyc?.selfie_path),
      documents: {
        pan: Boolean(kyc?.pan_card_path),
        aadhaar_front: Boolean(kyc?.aadhaar_front_path),
        aadhaar_back: Boolean(kyc?.aadhaar_back_path),
        selfie: Boolean(kyc?.selfie_path),
      },
      partner: {
        partner_code: row.partner_code,
        status: row.status,
        profiles: profile,
      },
    };
  }));
}

export async function reviewKycSubmission(id: string, status: ReviewStatus, reason?: string) {
  const admin = await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const now = new Date().toISOString();
  const needsReason = status === "rejected" || status === "resubmission_required";
  const cleanReason = reason?.trim() || "";
  if (needsReason && !cleanReason) {
    throw new Error("A reason is required for rejection or resubmission.");
  }

  const partnerStatus = status === "verified" ? "verified" : status === "rejected" ? "rejected" : "pending";
  const { error: partnerError } = await supabase
    .from("partners" as any)
    .update({
      kyc_status: partnerStatus,
      bank_verified: status === "verified",
      kyc_reviewed_at: status === "verified" || status === "rejected" ? now : null,
      payout_hold_reason: status === "verified" ? null : cleanReason || null,
      updated_at: now,
    })
    .eq("id", id);
  if (partnerError) throw partnerError;

  try {
    await supabase
      .from("partner_kyc" as any)
      .update({
        status,
        review_started_at: status === "under_review" ? now : undefined,
        approved_at: status === "verified" ? now : null,
        rejected_at: status === "rejected" ? now : null,
        reviewed_by: (admin as any)?.id || null,
        reviewed_at: status === "verified" || status === "rejected" || status === "resubmission_required" ? now : null,
        rejection_reason: status === "rejected" ? cleanReason : null,
        resubmission_reason: status === "resubmission_required" ? cleanReason : null,
        updated_at: now,
      })
      .eq("partner_id", id);
  } catch {
    // partner_kyc table may not exist — partners table update above is sufficient
  }

  await supabase.from("activity_logs" as any).insert({
    actor_id: (admin as any)?.id || null,
    actor_role: "admin",
    action: "kyc_status_changed",
    entity_type: "partner",
    entity_id: id,
    new_value: { status, reason: cleanReason || null },
  });

  revalidatePath("/admin/kyc");
  revalidatePath("/partner/kyc");
  revalidatePath("/partner/payouts");
}
