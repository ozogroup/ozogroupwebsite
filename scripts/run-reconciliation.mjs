/**
 * Production Data Reconciliation Script
 *
 * Reads .env.local for Supabase credentials, then:
 * 1. Audits all partner wallet_balance and paid_earnings against the commissions/payouts ledger
 * 2. Scans Supabase Storage for orphaned KYC documents and reconnects them
 * 3. Applies repairs and logs everything to activity_logs
 *
 * Usage:
 *   node scripts/run-reconciliation.mjs          # audit only (dry run)
 *   node scripts/run-reconciliation.mjs --repair  # audit + repair
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.+)$/);
  if (match) env[match[1]] = match[2].trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const repair = process.argv.includes("--repair");
console.log(`\n=== KIA Reconciliation ${repair ? "REPAIR" : "AUDIT"} ===\n`);

const supabase = createClient(supabaseUrl, serviceKey);

function roundMoney(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

// ─── Step 1: Wallet & Paid Earnings Audit ──────────────────────────

const [{ data: partners }, { data: commissions }, { data: payouts }] = await Promise.all([
  supabase.from("partners").select("id, partner_code, wallet_balance, total_earnings, paid_earnings, profiles(full_name)").order("created_at", { ascending: true }),
  supabase.from("commissions").select("id, partner_id, amount, status, reversed, deleted_at").is("deleted_at", null),
  supabase.from("payouts").select("id, partner_id, amount, gross_amount, net_amount, status"),
]);

console.log(`Partners: ${(partners || []).length}  |  Commissions: ${(commissions || []).length}  |  Payouts: ${(payouts || []).length}\n`);

const walletRepairs = [];
const paidRepairs = [];

for (const p of (partners || [])) {
  const pid = p.id;
  const pCode = p.partner_code || "?";
  const pName = (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles)?.full_name || "Unnamed";

  const pc = (commissions || []).filter(c => c.partner_id === pid && !c.reversed && ["approved", "paid"].includes(c.status));
  const approvedSum = pc.filter(c => c.status === "approved").reduce((s, c) => s + Number(c.amount || 0), 0);

  const pp = (payouts || []).filter(x => x.partner_id === pid);
  const paidPayoutNet = pp.filter(x => x.status === "paid").reduce((s, x) => s + Number(x.net_amount || x.amount || 0), 0);

  const expectedWallet = roundMoney(approvedSum);
  const currentWallet = roundMoney(Number(p.wallet_balance || 0));
  if (Math.abs(expectedWallet - currentWallet) > 0.009) {
    walletRepairs.push({ pid, pCode, pName, field: "wallet_balance", before: currentWallet, after: expectedWallet });
  }

  const expectedPaid = roundMoney(paidPayoutNet);
  const currentPaid = roundMoney(Number(p.paid_earnings || 0));
  if (Math.abs(expectedPaid - currentPaid) > 0.009) {
    paidRepairs.push({ pid, pCode, pName, field: "paid_earnings", before: currentPaid, after: expectedPaid });
  }
}

console.log(`--- Wallet Balance Discrepancies: ${walletRepairs.length} ---`);
for (const r of walletRepairs) {
  console.log(`  ${r.pName} (${r.pCode}): ${r.before} → ${r.after}`);
}

console.log(`\n--- Paid Earnings Discrepancies: ${paidRepairs.length} ---`);
for (const r of paidRepairs) {
  console.log(`  ${r.pName} (${r.pCode}): ${r.before} → ${r.after}`);
}

// ─── Step 2: KYC Document Recovery ─────────────────────────────────

const { data: kycPartners } = await supabase
  .from("partners")
  .select("id, partner_code, kyc_status, profiles(full_name)")
  .or("kyc_status.eq.verified,kyc_status.eq.pending,kyc_status.eq.under_review,kyc_status.eq.resubmission_required,bank_verified.eq.true");

const docTypes = [
  { col: "pan_card_path", dir: "pan-card", label: "PAN Card" },
  { col: "aadhaar_front_path", dir: "aadhaar-front", label: "Aadhaar Front" },
  { col: "aadhaar_back_path", dir: "aadhaar-back", label: "Aadhaar Back" },
  { col: "selfie_path", dir: "selfie", label: "Selfie" },
  { col: "cheque_path", dir: "cheque-or-passbook", label: "Cheque" },
];

const kycRecoveries = [];
console.log(`\n--- KYC Document Scan (${(kycPartners || []).length} partners) ---`);

for (const partner of (kycPartners || [])) {
  const pid = partner.id;
  const pCode = partner.partner_code || "?";
  const pName = (Array.isArray(partner.profiles) ? partner.profiles[0] : partner.profiles)?.full_name || "Unnamed";

  let kycRow = null;
  try {
    const { data } = await supabase.from("partner_kyc").select("*").eq("partner_id", pid).maybeSingle();
    kycRow = data;
  } catch {}

  if (!kycRow) continue;

  for (const dt of docTypes) {
    if (kycRow[dt.col]) continue; // already has path

    let recovered = false;
    let storagePath = "";

    try {
      // Try primary bucket
      const { data: files } = await supabase.storage.from("partner-kyc-private").list(`partners/${pid}/${dt.dir}`, { limit: 10, sortBy: { column: "created_at", order: "desc" } });
      const valid = (files || []).filter(f => f.name && !f.name.startsWith("."));

      if (valid.length > 0) {
        storagePath = `partners/${pid}/${dt.dir}/${valid[0].name}`;
        const { error: signErr } = await supabase.storage.from("partner-kyc-private").createSignedUrl(storagePath, 60);
        if (!signErr) recovered = true;
      } else {
        // Try legacy bucket
        const { data: legacyFiles } = await supabase.storage.from("kyc-documents").list(`partners/${pid}/${dt.dir}`, { limit: 10, sortBy: { column: "created_at", order: "desc" } });
        const legacyValid = (legacyFiles || []).filter(f => f.name && !f.name.startsWith("."));
        if (legacyValid.length > 0) {
          storagePath = `partners/${pid}/${dt.dir}/${legacyValid[0].name}`;
          recovered = true;
        }
      }
    } catch {}

    kycRecoveries.push({ pid, pCode, pName, doc: dt.label, path: storagePath, col: dt.col, recovered });
    const status = recovered ? "✓ FOUND" : "✗ MISSING";
    console.log(`  ${pName} (${pCode}) — ${dt.label}: ${status}${storagePath ? ` [${storagePath}]` : ""}`);
  }
}

// ─── Step 3: Apply Repairs ─────────────────────────────────────────

if (repair) {
  console.log("\n=== APPLYING REPAIRS ===\n");
  const now = new Date().toISOString();

  for (const r of walletRepairs) {
    const { error } = await supabase.from("partners").update({ wallet_balance: r.after, updated_at: now }).eq("id", r.pid);
    if (error) { console.log(`  ✗ Wallet repair failed for ${r.pCode}: ${error.message}`); continue; }
    await supabase.from("wallet_transactions").insert({
      partner_id: r.pid, transaction_type: "adjustment_credit",
      amount: Math.abs(r.after - r.before), balance_before: r.before, balance_after: r.after,
      reference_type: "reconciliation", notes: `Reconciliation: wallet corrected ${r.before} → ${r.after}`,
    });
    await supabase.from("activity_logs").insert({
      actor_role: "system", action: "wallet_reconciliation",
      entity_type: "partner", entity_id: r.pid,
      old_value: { wallet_balance: r.before }, new_value: { wallet_balance: r.after },
    });
    console.log(`  ✓ ${r.pName} (${r.pCode}) wallet: ${r.before} → ${r.after}`);
  }

  for (const r of paidRepairs) {
    const { error } = await supabase.from("partners").update({ paid_earnings: r.after, updated_at: now }).eq("id", r.pid);
    if (error) { console.log(`  ✗ Paid earnings repair failed for ${r.pCode}: ${error.message}`); continue; }
    await supabase.from("activity_logs").insert({
      actor_role: "system", action: "paid_earnings_reconciliation",
      entity_type: "partner", entity_id: r.pid,
      old_value: { paid_earnings: r.before }, new_value: { paid_earnings: r.after },
    });
    console.log(`  ✓ ${r.pName} (${r.pCode}) paid_earnings: ${r.before} → ${r.after}`);
  }

  for (const r of kycRecoveries.filter(x => x.recovered)) {
    const { error } = await supabase.from("partner_kyc").update({ [r.col]: r.path, updated_at: now }).eq("partner_id", r.pid);
    if (error) { console.log(`  ✗ KYC recovery failed for ${r.pCode} ${r.doc}: ${error.message}`); continue; }
    console.log(`  ✓ ${r.pName} (${r.pCode}) ${r.doc}: path restored → ${r.path}`);
  }

  // Re-check auto-verify for partners with recovered docs
  const recoveredPids = new Set(kycRecoveries.filter(x => x.recovered).map(x => x.pid));
  for (const pid of recoveredPids) {
    try {
      const { data: k } = await supabase.from("partner_kyc")
        .select("pan_card_path, aadhaar_front_path, aadhaar_back_path, selfie_path, cheque_path, payment_method, full_name, mobile_number, email, account_holder_name, bank_name, account_number, bank_ifsc, upi_id, upi_holder_name")
        .eq("partner_id", pid).maybeSingle();
      if (!k) continue;
      const docsOk = Boolean(k.pan_card_path && k.aadhaar_front_path && k.aadhaar_back_path && k.selfie_path && (k.payment_method === "upi" || k.cheque_path));
      const fieldsOk = Boolean(k.full_name && k.mobile_number && k.email && (k.payment_method === "bank" ? (k.account_number && k.bank_ifsc && k.account_holder_name && k.bank_name) : (k.upi_id && k.upi_holder_name)));
      const { data: pr } = await supabase.from("partners").select("kyc_status").eq("id", pid).maybeSingle();
      if (docsOk && fieldsOk && pr && pr.kyc_status !== "verified" && pr.kyc_status !== "rejected") {
        await supabase.from("partners").update({ kyc_status: "verified", bank_verified: true, kyc_reviewed_at: now, payout_hold_reason: null, updated_at: now }).eq("id", pid);
        await supabase.from("partner_kyc").update({ status: "verified", approved_at: now, reviewed_at: now, updated_at: now }).eq("partner_id", pid);
        const pCode = (kycPartners || []).find(p => p.id === pid)?.partner_code || "?";
        console.log(`  ✓ ${pCode} auto-verified after document recovery`);
      }
    } catch {}
  }

  console.log("\n=== REPAIRS COMPLETE ===");
} else {
  console.log("\n(Dry run — use --repair to apply changes)\n");
}

// ─── Summary ───────────────────────────────────────────────────────

console.log("\n=== SUMMARY ===");
console.log(`  Partners scanned:        ${(partners || []).length}`);
console.log(`  Wallet discrepancies:    ${walletRepairs.length}`);
console.log(`  Paid earnings issues:    ${paidRepairs.length}`);
console.log(`  KYC docs recovered:      ${kycRecoveries.filter(x => x.recovered).length}`);
console.log(`  KYC docs truly missing:  ${kycRecoveries.filter(x => !x.recovered).length}`);
console.log(`  Mode:                    ${repair ? "REPAIR (applied)" : "AUDIT (dry run)"}`);
console.log("");
