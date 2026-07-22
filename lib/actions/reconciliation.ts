"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { roundMoney } from "@/lib/finance";
import { revalidatePath } from "next/cache";

type RepairEntry = {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  field: string;
  before: number | string | null;
  after: number | string | null;
  reason: string;
};

type ReconciliationReport = {
  timestamp: string;
  walletRepairs: RepairEntry[];
  paidEarningsRepairs: RepairEntry[];
  payoutRepairs: RepairEntry[];
  kycRecoveries: {
    partnerId: string;
    partnerCode: string;
    partnerName: string;
    documentType: string;
    storagePath: string;
    recovered: boolean;
    error?: string;
  }[];
  summary: {
    partnersScanned: number;
    walletDiscrepancies: number;
    paidEarningsDiscrepancies: number;
    kycDocumentsRecovered: number;
    kycDocumentsMissing: number;
    errors: string[];
  };
};

export async function runReconciliationAudit(): Promise<ReconciliationReport> {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    walletRepairs: [],
    paidEarningsRepairs: [],
    payoutRepairs: [],
    kycRecoveries: [],
    summary: {
      partnersScanned: 0,
      walletDiscrepancies: 0,
      paidEarningsDiscrepancies: 0,
      kycDocumentsRecovered: 0,
      kycDocumentsMissing: 0,
      errors: [],
    },
  };

  const [{ data: partners }, { data: commissions }, { data: payouts }] = await Promise.all([
    supabase
      .from("partners" as any)
      .select("id, partner_code, wallet_balance, total_earnings, paid_earnings, profiles(full_name)")
      .order("created_at", { ascending: true }),
    supabase
      .from("commissions" as any)
      .select("id, partner_id, amount, status, reversed, deleted_at")
      .is("deleted_at", null),
    supabase
      .from("payouts" as any)
      .select("id, partner_id, amount, gross_amount, net_amount, status"),
  ]);

  const partnerRows = (partners || []) as any[];
  const commissionRows = (commissions || []) as any[];
  const payoutRows = (payouts || []) as any[];

  report.summary.partnersScanned = partnerRows.length;

  for (const partner of partnerRows) {
    const pid = partner.id;
    const pCode = partner.partner_code || "unknown";
    const pName = (Array.isArray(partner.profiles) ? partner.profiles[0] : partner.profiles)?.full_name || "Unnamed";

    const partnerCommissions = commissionRows.filter(
      (c: any) => c.partner_id === pid && !c.reversed && ["approved", "paid"].includes(c.status)
    );
    const approvedSum = partnerCommissions
      .filter((c: any) => c.status === "approved")
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    const paidCommissionSum = partnerCommissions
      .filter((c: any) => c.status === "paid")
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

    const partnerPayouts = payoutRows.filter((p: any) => p.partner_id === pid);
    const paidPayoutGross = partnerPayouts
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.gross_amount || p.amount || 0), 0);
    const paidPayoutNet = partnerPayouts
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.net_amount || p.amount || 0), 0);

    // Canonical wallet_balance = sum of approved commissions (not yet paid out)
    // After a payout is marked paid, its commissions move from "approved" to "paid",
    // so the remaining approved commission sum IS the correct wallet balance.
    const expectedWallet = roundMoney(approvedSum);
    const currentWallet = roundMoney(Number(partner.wallet_balance || 0));

    if (Math.abs(expectedWallet - currentWallet) > 0.009) {
      report.walletRepairs.push({
        partnerId: pid,
        partnerCode: pCode,
        partnerName: pName,
        field: "wallet_balance",
        before: currentWallet,
        after: expectedWallet,
        reason: `Approved commissions sum to ${expectedWallet} but wallet shows ${currentWallet}. Likely caused by wallet_balance=0 bug in payout settlement.`,
      });
      report.summary.walletDiscrepancies++;
    }

    // Canonical paid_earnings = sum of net amounts from paid payouts
    const expectedPaid = roundMoney(paidPayoutNet);
    const currentPaid = roundMoney(Number(partner.paid_earnings || 0));

    if (Math.abs(expectedPaid - currentPaid) > 0.009) {
      report.paidEarningsRepairs.push({
        partnerId: pid,
        partnerCode: pCode,
        partnerName: pName,
        field: "paid_earnings",
        before: currentPaid,
        after: expectedPaid,
        reason: `Paid payout net amounts sum to ${expectedPaid} but paid_earnings shows ${currentPaid}.`,
      });
      report.summary.paidEarningsDiscrepancies++;
    }
  }

  return report;
}

export async function executeWalletReconciliation(): Promise<ReconciliationReport> {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const report = await runReconciliationAudit();
  const now = new Date().toISOString();
  const errors: string[] = [];

  // Repair wallet balances
  for (const repair of report.walletRepairs) {
    try {
      const newBalance = Number(repair.after || 0);
      const oldBalance = Number(repair.before || 0);
      const { error } = await supabase
        .from("partners" as any)
        .update({
          wallet_balance: newBalance,
          updated_at: now,
        })
        .eq("id", repair.partnerId);
      if (error) throw error;

      await supabase.from("wallet_transactions" as any).insert({
        partner_id: repair.partnerId,
        transaction_type: "adjustment_credit",
        amount: Math.abs(newBalance - oldBalance),
        balance_before: oldBalance,
        balance_after: newBalance,
        reference_type: "reconciliation",
        reference_id: null,
        notes: `Reconciliation repair: ${repair.reason}`,
      });

      await supabase.from("activity_logs" as any).insert({
        actor_id: null,
        actor_role: "system",
        action: "wallet_reconciliation",
        entity_type: "partner",
        entity_id: repair.partnerId,
        old_value: { wallet_balance: repair.before },
        new_value: { wallet_balance: repair.after, reason: repair.reason },
      });
    } catch (e: any) {
      errors.push(`Wallet repair for ${repair.partnerCode}: ${e?.message}`);
    }
  }

  // Repair paid_earnings
  for (const repair of report.paidEarningsRepairs) {
    try {
      const newPaid = Number(repair.after || 0);
      const { error } = await supabase
        .from("partners" as any)
        .update({
          paid_earnings: newPaid,
          updated_at: now,
        })
        .eq("id", repair.partnerId);
      if (error) throw error;

      await supabase.from("activity_logs" as any).insert({
        actor_id: null,
        actor_role: "system",
        action: "paid_earnings_reconciliation",
        entity_type: "partner",
        entity_id: repair.partnerId,
        old_value: { paid_earnings: repair.before },
        new_value: { paid_earnings: repair.after, reason: repair.reason },
      });
    } catch (e: any) {
      errors.push(`Paid earnings repair for ${repair.partnerCode}: ${e?.message}`);
    }
  }

  report.summary.errors = errors;

  revalidatePath("/admin/payouts");
  revalidatePath("/admin/wallets");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/commissions");
  revalidatePath("/admin/reports");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/payouts");
  revalidatePath("/partner/income");

  return report;
}

export async function recoverKycDocuments(): Promise<ReconciliationReport["kycRecoveries"]> {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const recoveries: ReconciliationReport["kycRecoveries"] = [];

  // Get all partners who have KYC submitted or verified
  const { data: partners } = await supabase
    .from("partners" as any)
    .select("id, partner_code, kyc_status, profiles(full_name)")
    .or("kyc_status.eq.verified,kyc_status.eq.pending,kyc_status.eq.under_review,kyc_status.eq.resubmission_required,bank_verified.eq.true");

  if (!partners || partners.length === 0) return recoveries;

  const docTypes = [
    { dbColumn: "pan_card_path", storageDir: "pan-card", label: "PAN Card" },
    { dbColumn: "aadhaar_front_path", storageDir: "aadhaar-front", label: "Aadhaar Front" },
    { dbColumn: "aadhaar_back_path", storageDir: "aadhaar-back", label: "Aadhaar Back" },
    { dbColumn: "selfie_path", storageDir: "selfie", label: "Selfie" },
    { dbColumn: "cheque_path", storageDir: "cheque-or-passbook", label: "Cheque/Passbook" },
  ];

  for (const partner of partners as any[]) {
    const pid = partner.id;
    const pCode = partner.partner_code || "unknown";
    const pName = (Array.isArray(partner.profiles) ? partner.profiles[0] : partner.profiles)?.full_name || "Unnamed";

    // Check current partner_kyc row
    let kycRow: any = null;
    try {
      const { data } = await supabase
        .from("partner_kyc" as any)
        .select("id, pan_card_path, aadhaar_front_path, aadhaar_back_path, selfie_path, cheque_path")
        .eq("partner_id", pid)
        .maybeSingle();
      kycRow = data as any;
    } catch {
      // table may not exist
    }

    if (!kycRow) {
      try {
        const { data: newRow } = await supabase
          .from("partner_kyc" as any)
          .upsert({
            partner_id: pid,
            full_name: pName,
            status: partner.kyc_status || "pending",
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "partner_id" })
          .select("id, pan_card_path, aadhaar_front_path, aadhaar_back_path, selfie_path, cheque_path")
          .single();
        kycRow = newRow as any;
      } catch {
        // If we can't create the row, skip this partner
        continue;
      }
      if (!kycRow) continue;
    }

    for (const docType of docTypes) {
      const currentPath = kycRow[docType.dbColumn];
      if (currentPath) continue; // already has a path, skip

      // Search storage for this document
      try {
        const { data: files, error: listError } = await supabase.storage
          .from("partner-kyc-private")
          .list(`partners/${pid}/${docType.storageDir}`, { limit: 10, sortBy: { column: "created_at", order: "desc" } });

        if (listError || !files || files.length === 0) {
          // Also try legacy bucket
          const { data: legacyFiles } = await supabase.storage
            .from("kyc-documents")
            .list(`partners/${pid}/${docType.storageDir}`, { limit: 10, sortBy: { column: "created_at", order: "desc" } });

          if (!legacyFiles || legacyFiles.length === 0) {
            recoveries.push({
              partnerId: pid,
              partnerCode: pCode,
              partnerName: pName,
              documentType: docType.label,
              storagePath: "",
              recovered: false,
              error: "File not found in any storage bucket",
            });
            continue;
          }

          // Use the most recent file from legacy bucket
          const latestFile = legacyFiles.filter((f: any) => f.name && !f.name.startsWith(".")).sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
          if (!latestFile) {
            recoveries.push({
              partnerId: pid,
              partnerCode: pCode,
              partnerName: pName,
              documentType: docType.label,
              storagePath: "",
              recovered: false,
              error: "No valid files found in legacy bucket",
            });
            continue;
          }

          const fullPath = `partners/${pid}/${docType.storageDir}/${latestFile.name}`;
          const { error: updateError } = await supabase
            .from("partner_kyc" as any)
            .update({ [docType.dbColumn]: fullPath, updated_at: new Date().toISOString() })
            .eq("partner_id", pid);

          recoveries.push({
            partnerId: pid,
            partnerCode: pCode,
            partnerName: pName,
            documentType: docType.label,
            storagePath: fullPath,
            recovered: !updateError,
            error: updateError?.message,
          });
          continue;
        }

        // Use the most recent file
        const latestFile = files.filter((f: any) => f.name && !f.name.startsWith(".")).sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
        if (!latestFile) {
          recoveries.push({
            partnerId: pid,
            partnerCode: pCode,
            partnerName: pName,
            documentType: docType.label,
            storagePath: "",
            recovered: false,
            error: "No valid files found",
          });
          continue;
        }

        const fullPath = `partners/${pid}/${docType.storageDir}/${latestFile.name}`;

        // Verify the file is accessible
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from("partner-kyc-private")
          .createSignedUrl(fullPath, 60);

        if (signError || !signedUrlData?.signedUrl) {
          recoveries.push({
            partnerId: pid,
            partnerCode: pCode,
            partnerName: pName,
            documentType: docType.label,
            storagePath: fullPath,
            recovered: false,
            error: `File exists but signed URL failed: ${signError?.message || "unknown"}`,
          });
          continue;
        }

        // Update partner_kyc with recovered path
        const { error: updateError } = await supabase
          .from("partner_kyc" as any)
          .update({ [docType.dbColumn]: fullPath, updated_at: new Date().toISOString() })
          .eq("partner_id", pid);

        recoveries.push({
          partnerId: pid,
          partnerCode: pCode,
          partnerName: pName,
          documentType: docType.label,
          storagePath: fullPath,
          recovered: !updateError,
          error: updateError?.message,
        });
      } catch (e: any) {
        recoveries.push({
          partnerId: pid,
          partnerCode: pCode,
          partnerName: pName,
          documentType: docType.label,
          storagePath: "",
          recovered: false,
          error: e?.message || "Unknown error during recovery",
        });
      }
    }
  }

  // After recovering docs, re-check auto-verify eligibility for each affected partner
  const recoveredPartnerIds = new Set(
    recoveries.filter((r) => r.recovered).map((r) => r.partnerId)
  );

  for (const pid of recoveredPartnerIds) {
    try {
      const { data: kycCheck } = await supabase
        .from("partner_kyc" as any)
        .select("pan_card_path, aadhaar_front_path, aadhaar_back_path, selfie_path, cheque_path, payment_method, full_name, mobile_number, email, account_holder_name, bank_name, account_number, bank_ifsc, upi_id, upi_holder_name")
        .eq("partner_id", pid)
        .maybeSingle();
      const k = kycCheck as any;
      if (!k) continue;

      const docsComplete = Boolean(
        k.pan_card_path && k.aadhaar_front_path && k.aadhaar_back_path && k.selfie_path &&
        (k.payment_method === "upi" || k.cheque_path)
      );
      const fieldsComplete = Boolean(
        k.full_name && k.mobile_number && k.email &&
        (k.payment_method === "bank"
          ? (k.account_number && k.bank_ifsc && k.account_holder_name && k.bank_name)
          : (k.upi_id && k.upi_holder_name))
      );

      // Only update if partner is currently in a non-verified state that should be verified
      const { data: partnerRow } = await supabase
        .from("partners" as any)
        .select("kyc_status")
        .eq("id", pid)
        .maybeSingle();

      if (docsComplete && fieldsComplete && partnerRow && (partnerRow as any).kyc_status !== "verified" && (partnerRow as any).kyc_status !== "rejected") {
        await supabase.from("partners" as any).update({
          kyc_status: "verified",
          bank_verified: true,
          kyc_reviewed_at: new Date().toISOString(),
          payout_hold_reason: null,
          updated_at: new Date().toISOString(),
        }).eq("id", pid);

        await supabase.from("partner_kyc" as any).update({
          status: "verified",
          approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("partner_id", pid);
      }
    } catch {}
  }

  revalidatePath("/admin/kyc");
  revalidatePath("/partner/kyc");

  return recoveries;
}

export async function runFullReconciliation() {
  await requireAdmin();

  const walletReport = await executeWalletReconciliation();
  const kycRecoveries = await recoverKycDocuments();

  walletReport.kycRecoveries = kycRecoveries;
  walletReport.summary.kycDocumentsRecovered = kycRecoveries.filter((r) => r.recovered).length;
  walletReport.summary.kycDocumentsMissing = kycRecoveries.filter((r) => !r.recovered).length;

  // Log the full reconciliation run
  const supabase = getSupabaseServiceClient();
  await supabase.from("activity_logs" as any).insert({
    actor_id: null,
    actor_role: "system",
    action: "full_reconciliation",
    entity_type: "system",
    entity_id: "reconciliation",
    new_value: {
      walletRepairs: walletReport.walletRepairs.length,
      paidEarningsRepairs: walletReport.paidEarningsRepairs.length,
      kycRecovered: walletReport.summary.kycDocumentsRecovered,
      kycMissing: walletReport.summary.kycDocumentsMissing,
      errors: walletReport.summary.errors,
    },
  });

  return walletReport;
}
