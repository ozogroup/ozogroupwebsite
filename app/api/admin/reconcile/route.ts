"use server";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { roundMoney } from "@/lib/finance";

// Secured by checking the service role key in the Authorization header.
// This allows running reconciliation via curl or a deploy script without
// needing to log in through the browser admin UI.
function authorizeServiceCall(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return Boolean(token && serviceKey && token === serviceKey);
}

export async function POST(req: NextRequest) {
  if (!authorizeServiceCall(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || "audit"; // "audit" or "repair"

  const supabase = getSupabaseServiceClient();

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

  const walletRepairs: any[] = [];
  const paidRepairs: any[] = [];

  for (const partner of partnerRows) {
    const pid = partner.id;
    const pCode = partner.partner_code || "?";
    const pName = (Array.isArray(partner.profiles) ? partner.profiles[0] : partner.profiles)?.full_name || "Unnamed";

    const partnerCommissions = commissionRows.filter(
      (c: any) => c.partner_id === pid && !c.reversed && ["approved", "paid"].includes(c.status)
    );
    const approvedSum = partnerCommissions
      .filter((c: any) => c.status === "approved")
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

    const partnerPayouts = payoutRows.filter((p: any) => p.partner_id === pid);
    const paidPayoutNet = partnerPayouts
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.net_amount || p.amount || 0), 0);

    const expectedWallet = roundMoney(approvedSum);
    const currentWallet = roundMoney(Number(partner.wallet_balance || 0));
    if (Math.abs(expectedWallet - currentWallet) > 0.009) {
      walletRepairs.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, before: currentWallet, after: expectedWallet });
    }

    const expectedPaid = roundMoney(paidPayoutNet);
    const currentPaid = roundMoney(Number(partner.paid_earnings || 0));
    if (Math.abs(expectedPaid - currentPaid) > 0.009) {
      paidRepairs.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, before: currentPaid, after: expectedPaid });
    }
  }

  // KYC document recovery scan
  const { data: kycPartners } = await supabase
    .from("partners" as any)
    .select("id, partner_code, kyc_status, profiles(full_name)")
    .or("kyc_status.eq.verified,kyc_status.eq.pending,kyc_status.eq.under_review,kyc_status.eq.resubmission_required,bank_verified.eq.true");

  const docTypes = [
    { dbColumn: "pan_card_path", storageDir: "pan-card", label: "PAN Card" },
    { dbColumn: "aadhaar_front_path", storageDir: "aadhaar-front", label: "Aadhaar Front" },
    { dbColumn: "aadhaar_back_path", storageDir: "aadhaar-back", label: "Aadhaar Back" },
    { dbColumn: "selfie_path", storageDir: "selfie", label: "Selfie" },
    { dbColumn: "cheque_path", storageDir: "cheque-or-passbook", label: "Cheque" },
  ];

  const kycRecoveries: any[] = [];
  for (const partner of (kycPartners || []) as any[]) {
    const pid = partner.id;
    const pCode = partner.partner_code || "?";
    const pName = (Array.isArray(partner.profiles) ? partner.profiles[0] : partner.profiles)?.full_name || "Unnamed";

    let kycRow: any = null;
    try {
      const { data } = await supabase.from("partner_kyc" as any).select("*").eq("partner_id", pid).maybeSingle();
      kycRow = data as any;
    } catch {}

    if (!kycRow) continue;

    for (const dt of docTypes) {
      if (kycRow[dt.dbColumn]) continue; // path already set

      try {
        const { data: files } = await supabase.storage
          .from("partner-kyc-private")
          .list(`partners/${pid}/${dt.storageDir}`, { limit: 10, sortBy: { column: "created_at", order: "desc" } });

        const validFiles = (files || []).filter((f: any) => f.name && !f.name.startsWith("."));
        if (validFiles.length === 0) {
          // Try legacy bucket
          const { data: legacyFiles } = await supabase.storage
            .from("kyc-documents")
            .list(`partners/${pid}/${dt.storageDir}`, { limit: 10, sortBy: { column: "created_at", order: "desc" } });
          const legacyValid = (legacyFiles || []).filter((f: any) => f.name && !f.name.startsWith("."));
          if (legacyValid.length === 0) {
            kycRecoveries.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, doc: dt.label, recovered: false, error: "Not found in storage" });
            continue;
          }
          const fullPath = `partners/${pid}/${dt.storageDir}/${legacyValid[0].name}`;
          kycRecoveries.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, doc: dt.label, path: fullPath, recovered: mode === "repair", bucket: "legacy" });
          if (mode === "repair") {
            await supabase.from("partner_kyc" as any).update({ [dt.dbColumn]: fullPath, updated_at: new Date().toISOString() }).eq("partner_id", pid);
          }
          continue;
        }

        const fullPath = `partners/${pid}/${dt.storageDir}/${validFiles[0].name}`;
        // Verify signed URL works
        const { data: signedData, error: signError } = await supabase.storage.from("partner-kyc-private").createSignedUrl(fullPath, 60);
        if (signError) {
          kycRecoveries.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, doc: dt.label, path: fullPath, recovered: false, error: `Signed URL failed: ${signError.message}` });
          continue;
        }

        kycRecoveries.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, doc: dt.label, path: fullPath, signedUrl: signedData?.signedUrl ? "OK" : "FAIL", recovered: mode === "repair" });
        if (mode === "repair") {
          await supabase.from("partner_kyc" as any).update({ [dt.dbColumn]: fullPath, updated_at: new Date().toISOString() }).eq("partner_id", pid);
        }
      } catch (e: any) {
        kycRecoveries.push({ partnerId: pid, partnerCode: pCode, partnerName: pName, doc: dt.label, recovered: false, error: e?.message });
      }
    }
  }

  if (mode === "repair") {
    const now = new Date().toISOString();
    for (const r of walletRepairs) {
      await supabase.from("partners" as any).update({ wallet_balance: r.after, updated_at: now }).eq("id", r.partnerId);
      await supabase.from("wallet_transactions" as any).insert({
        partner_id: r.partnerId,
        transaction_type: "adjustment_credit",
        amount: Math.abs(r.after - r.before),
        balance_before: r.before,
        balance_after: r.after,
        reference_type: "reconciliation",
        reference_id: null,
        notes: `Reconciliation: wallet_balance corrected from ${r.before} to ${r.after}`,
      });
      await supabase.from("activity_logs" as any).insert({
        actor_role: "system", action: "wallet_reconciliation",
        entity_type: "partner", entity_id: r.partnerId,
        old_value: { wallet_balance: r.before }, new_value: { wallet_balance: r.after },
      });
    }
    for (const r of paidRepairs) {
      await supabase.from("partners" as any).update({ paid_earnings: r.after, updated_at: now }).eq("id", r.partnerId);
      await supabase.from("activity_logs" as any).insert({
        actor_role: "system", action: "paid_earnings_reconciliation",
        entity_type: "partner", entity_id: r.partnerId,
        old_value: { paid_earnings: r.before }, new_value: { paid_earnings: r.after },
      });
    }

    // After KYC doc recovery, re-check auto-verify for affected partners
    const recoveredPids = new Set(kycRecoveries.filter((r) => r.recovered).map((r) => r.partnerId));
    for (const pid of recoveredPids) {
      try {
        const { data: k } = await supabase.from("partner_kyc" as any)
          .select("pan_card_path, aadhaar_front_path, aadhaar_back_path, selfie_path, cheque_path, payment_method, full_name, mobile_number, email, account_holder_name, bank_name, account_number, bank_ifsc, upi_id, upi_holder_name")
          .eq("partner_id", pid).maybeSingle();
        const kk = k as any;
        if (!kk) continue;
        const docsOk = Boolean(kk.pan_card_path && kk.aadhaar_front_path && kk.aadhaar_back_path && kk.selfie_path && (kk.payment_method === "upi" || kk.cheque_path));
        const fieldsOk = Boolean(kk.full_name && kk.mobile_number && kk.email && (kk.payment_method === "bank" ? (kk.account_number && kk.bank_ifsc && kk.account_holder_name && kk.bank_name) : (kk.upi_id && kk.upi_holder_name)));
        const { data: pr } = await supabase.from("partners" as any).select("kyc_status").eq("id", pid).maybeSingle();
        if (docsOk && fieldsOk && pr && (pr as any).kyc_status !== "verified" && (pr as any).kyc_status !== "rejected") {
          await supabase.from("partners" as any).update({ kyc_status: "verified", bank_verified: true, kyc_reviewed_at: now, payout_hold_reason: null, updated_at: now }).eq("id", pid);
          await supabase.from("partner_kyc" as any).update({ status: "verified", approved_at: now, reviewed_at: now, updated_at: now }).eq("partner_id", pid);
        }
      } catch {}
    }
  }

  return NextResponse.json({
    mode,
    timestamp: new Date().toISOString(),
    partnersScanned: partnerRows.length,
    walletRepairs,
    paidRepairs,
    kycRecoveries,
    summary: {
      walletDiscrepancies: walletRepairs.length,
      paidEarningsDiscrepancies: paidRepairs.length,
      kycDocumentsNeedingRecovery: kycRecoveries.filter((r) => !r.recovered && r.error !== "Not found in storage").length,
      kycDocumentsTrulyMissing: kycRecoveries.filter((r) => r.error === "Not found in storage").length,
      kycRecovered: kycRecoveries.filter((r) => r.recovered).length,
    },
  });
}
