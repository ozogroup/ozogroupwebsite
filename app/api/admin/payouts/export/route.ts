import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value || 0).toFixed(2);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function profileFrom(row: any) {
  return Array.isArray(row?.profiles) ? row.profiles[0] : row?.profiles;
}

function maskAccount(input?: string | null) {
  const clean = String(input || "").replace(/\s+/g, "");
  return clean ? `XXXX${clean.slice(-4)}` : "";
}

function maskUpi(input?: string | null) {
  const clean = String(input || "").trim().toLowerCase();
  const [name, handle] = clean.split("@");
  return name && handle ? `${name.slice(0, 2)}***@${handle}` : clean;
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const objects: string[] = [];
  const content = [
    "BT",
    "/F1 10 Tf",
    "40 800 Td",
    ...lines.slice(0, 56).map((line, index) => `${index === 0 ? "" : "0 -13 Td"}(${pdfEscape(line)}) Tj`),
    "ET",
  ].join("\n");
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj");
  objects.push("3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj");
  objects.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj");
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream endobj`);

  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const body = objects.map((obj) => {
    xref.push(String(offset).padStart(10, "0") + " 00000 n ");
    offset += Buffer.byteLength(obj + "\n");
    return obj;
  }).join("\n") + "\n";
  const xrefOffset = offset;
  const trailer = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from("%PDF-1.4\n" + body + trailer);
}

async function loadRows(ids: string[]) {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("payouts" as any)
    .select(`
      id, partner_id, amount, gross_amount, deduction_rate, deduction_amount, net_amount,
      payment_method, payment_details, status, created_at, paid_at, transaction_reference,
      transaction_note, admin_notes,
      partner:partners(
        partner_code, kyc_status, bank_verified, bank_account_holder, bank_account_number,
        bank_ifsc, bank_name, bank_branch_name, upi_id, profiles(full_name, phone)
      )
    `)
    .order("created_at", { ascending: false });
  if (ids.length > 0) query = query.in("id", ids);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  const params = request.nextUrl.searchParams;
  const format = params.get("format") || "csv";
  const ids = params.getAll("id").filter((id) => /^[0-9a-f-]{20,}$/i.test(id));
  const rows = await loadRows(ids);

  const exportRows = rows.map((row: any, index: number) => {
    const partner = Array.isArray(row.partner) ? row.partner[0] : row.partner;
    const profile = profileFrom(partner);
    const method = row.payment_method || (partner?.upi_id ? "upi" : "bank");
    const gross = Number(row.gross_amount || row.amount || 0);
    const deductionRate = Number(row.deduction_rate ?? 0.15);
    const deduction = Number(row.deduction_amount ?? gross * deductionRate);
    const net = Number(row.net_amount || row.amount || gross - deduction);
    return {
      sr: index + 1,
      payoutId: row.id,
      partnerName: profile?.full_name || "",
      partnerCode: partner?.partner_code || "",
      mobile: profile?.phone || "",
      paymentMode: method,
      accountHolder: partner?.bank_account_holder || "",
      bankName: partner?.bank_name || "",
      accountNumber: method === "bank" ? partner?.bank_account_number || "" : "",
      maskedAccount: maskAccount(partner?.bank_account_number),
      ifsc: partner?.bank_ifsc || "",
      branch: partner?.bank_branch_name || "",
      upiId: method === "upi" ? partner?.upi_id || "" : "",
      maskedUpi: maskUpi(partner?.upi_id),
      gross,
      deductionRate,
      deduction,
      net,
      requestDate: row.created_at || "",
      kycStatus: partner?.kyc_status || "",
      payoutStatus: row.status || "",
      adminNote: row.admin_notes || row.transaction_note || "",
      transactionReference: row.transaction_reference || "",
    };
  });

  const totals = exportRows.reduce(
    (acc, row) => ({
      gross: acc.gross + row.gross,
      deduction: acc.deduction + row.deduction,
      net: acc.net + row.net,
    }),
    { gross: 0, deduction: 0, net: 0 }
  );

  const generatedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const filenameDate = new Date().toISOString().slice(0, 10);

  try {
    const supabase = getSupabaseServiceClient();
    await supabase.from("activity_logs" as any).insert({
      actor_id: (admin as any)?.id || null,
      actor_role: "admin",
      action: "payout_export_generated",
      entity_type: "payout",
      entity_id: ids[0] || null,
      new_value: { format, row_count: exportRows.length, generated_at: generatedAt },
    });
  } catch {
    // Export must not fail if the optional audit table is unavailable.
  }

  if (format === "pdf") {
    const lines = [
      "KIA Skin Care - Payout Statement",
      `Generated: ${generatedAt}`,
      `Generated By: ${(admin as any)?.email || "Admin"}`,
      `Total Partners: ${exportRows.length}`,
      `Total Gross Payout: Rs. ${money(totals.gross)}`,
      `Total 15% Deduction: Rs. ${money(totals.deduction)}`,
      `Total Net Payable: Rs. ${money(totals.net)}`,
      " ",
      "Sr | Payout ID | Partner | Partner ID | Mode | Gross | Deduction | Net | Status | Reference",
      ...exportRows.map((row) =>
        [
          row.sr,
          row.payoutId.slice(0, 8),
          row.partnerName,
          row.partnerCode,
          row.paymentMode,
          money(row.gross),
          money(row.deduction),
          money(row.net),
          row.payoutStatus,
          row.transactionReference,
        ].join(" | ")
      ),
      " ",
      "Prepared by KIA Skin Care Admin",
      "Approved By: ____________________    Date: ____________",
    ];
    return new NextResponse(buildSimplePdf(lines), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kia-payout-statement-${filenameDate}.pdf"`,
      },
    });
  }

  if (format === "print") {
    const body = `<!doctype html><html><head><meta charset="utf-8"><title>KIA Payout Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#3f3632}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f4eee4}.totals{margin:16px 0;font-weight:700}</style></head><body><h1>KIA Skin Care Payout Report</h1><p>Generated: ${generatedAt}</p><div class="totals">Gross Rs. ${money(totals.gross)} | Deduction Rs. ${money(totals.deduction)} | Net Rs. ${money(totals.net)}</div><table><thead><tr><th>Sr</th><th>Payout ID</th><th>Partner</th><th>Partner ID</th><th>Mode</th><th>Gross</th><th>Deduction</th><th>Net</th><th>Status</th></tr></thead><tbody>${exportRows.map((row) => `<tr><td>${row.sr}</td><td>${row.payoutId}</td><td>${row.partnerName}</td><td>${row.partnerCode}</td><td>${row.paymentMode}</td><td>${money(row.gross)}</td><td>${money(row.deduction)}</td><td>${money(row.net)}</td><td>${row.payoutStatus}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
    return new NextResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const headers = [
    "Sr. No.",
    "Payout ID",
    "Partner Name",
    "Partner ID",
    "Registered Mobile",
    "Payment Mode",
    "Account Holder Name",
    "Bank Name",
    "Account Number",
    "IFSC Code",
    "Branch Name",
    "UPI ID",
    "Gross Amount",
    "Deduction Percentage",
    "Deduction Amount",
    "Net Payable",
    "Request Date",
    "KYC Status",
    "Payout Status",
    "Admin Note",
  ];
  const csv = [
    headers.map(csvCell).join(","),
    ...exportRows.map((row) => [
      row.sr,
      row.payoutId,
      row.partnerName,
      row.partnerCode,
      row.mobile,
      row.paymentMode,
      row.accountHolder,
      row.bankName,
      row.accountNumber,
      row.ifsc,
      row.branch,
      row.upiId,
      money(row.gross),
      `${money(row.deductionRate * 100)}%`,
      money(row.deduction),
      money(row.net),
      row.requestDate,
      row.kycStatus,
      row.payoutStatus,
      row.adminNote,
    ].map(csvCell).join(",")),
  ].join("\r\n");

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kia-payout-export-${filenameDate}.csv"`,
    },
  });
}
