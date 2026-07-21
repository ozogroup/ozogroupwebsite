import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function csvSanitize(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
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

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max - 2) + ".." : value;
}

// Multi-page PDF builder with proper headers per page
function buildMultiPagePdf(headerLines: string[], tableHeaders: string[], rows: string[][], footerLine: string) {
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 560;
  const LINE_HEIGHT = 12;
  const HEADER_HEIGHT = headerLines.length * 14 + 30;
  const LINES_PER_PAGE = Math.floor((MARGIN_TOP - 40 - HEADER_HEIGHT) / LINE_HEIGHT);
  const TABLE_HEADER_LINE = tableHeaders.join("  |  ");

  const pages: string[][] = [];
  let currentPage: string[] = [];
  let lineCount = 0;

  function newPage() {
    if (currentPage.length > 0) pages.push(currentPage);
    currentPage = [];
    lineCount = 0;
    for (const hl of headerLines) {
      currentPage.push(hl);
      lineCount++;
    }
    currentPage.push("");
    lineCount++;
    currentPage.push(TABLE_HEADER_LINE);
    lineCount++;
    currentPage.push("-".repeat(120));
    lineCount++;
  }

  newPage();
  for (const row of rows) {
    if (lineCount >= LINES_PER_PAGE) newPage();
    currentPage.push(row.join("  |  "));
    lineCount++;
  }
  currentPage.push("");
  currentPage.push(footerLine);
  pages.push(currentPage);

  const objects: string[] = [];
  const pageRefs: string[] = [];
  let objNum = 0;

  function addObj(content: string) {
    objNum++;
    objects.push(`${objNum} 0 obj ${content} endobj`);
    return objNum;
  }

  const catalogRef = addObj("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesObjPlaceholder = objects.length;
  addObj("PAGES_PLACEHOLDER");
  const fontRef = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldRef = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  for (let p = 0; p < pages.length; p++) {
    const pageLines = pages[p];
    const content = [
      "BT",
      `/F2 11 Tf`,
      `${MARGIN_LEFT} ${MARGIN_TOP + 15} Td`,
      `(${pdfEscape(`KIA Skin Care - Payout Report`)}) Tj`,
      `/F1 8 Tf`,
      `0 -14 Td`,
      `(${pdfEscape(`Page ${p + 1} of ${pages.length}`)}) Tj`,
      "0 -6 Td",
      ...pageLines.map((line, i) => {
        const isHeader = i < headerLines.length;
        const fontCmd = isHeader ? "/F2 8 Tf" : "/F1 7.5 Tf";
        return `${fontCmd} 0 -${LINE_HEIGHT} Td (${pdfEscape(truncate(line, 160))}) Tj`;
      }),
      "ET",
    ].join("\n");

    const streamRef = addObj(`<< /Length ${Buffer.byteLength(content)} >> stream\n${content}\nendstream`);
    const pageRef = addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${fontRef} 0 R /F2 ${fontBoldRef} 0 R >> >> /Contents ${streamRef} 0 R >>`
    );
    pageRefs.push(`${pageRef} 0 R`);
  }

  objects[pagesObjPlaceholder] = `2 0 obj << /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >> endobj`;

  const header = "%PDF-1.4\n";
  let offset = Buffer.byteLength(header);
  const xref = ["0000000000 65535 f "];
  const body = objects.map((obj) => {
    xref.push(String(offset).padStart(10, "0") + " 00000 n ");
    const line = obj + "\n";
    offset += Buffer.byteLength(line);
    return line;
  }).join("");
  const xrefOffset = offset;
  const trailer = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(header + body + trailer);
}

function getDateRange(range: string | null, from: string | null, to: string | null) {
  const now = new Date();
  if (range === "today") {
    const d = now.toISOString().slice(0, 10);
    return { from: d + "T00:00:00", to: d + "T23:59:59" };
  }
  if (range === "current_month") {
    const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, "0");
    return { from: `${y}-${m}-01T00:00:00`, to: now.toISOString() };
  }
  if (range === "previous_month") {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: prev.toISOString().slice(0, 10) + "T00:00:00", to: last.toISOString().slice(0, 10) + "T23:59:59" };
  }
  if (range === "fy") {
    const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return { from: `${fyStart}-04-01T00:00:00`, to: now.toISOString() };
  }
  if (from || to) {
    return {
      from: from ? from + "T00:00:00" : undefined,
      to: to ? to + "T23:59:59" : undefined,
    };
  }
  return {};
}

async function loadRows(ids: string[], dateRange?: { from?: string; to?: string }) {
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
  if (dateRange?.from) query = query.gte("created_at", dateRange.from);
  if (dateRange?.to) query = query.lte("created_at", dateRange.to);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function loadIncomeBreakdown(partnerIds: string[]) {
  if (partnerIds.length === 0) return new Map<string, { membership: number; booking: number; level: number }>();
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("commissions" as any)
    .select("partner_id, source_type, amount, level, status, reversed, deleted_at")
    .in("partner_id", partnerIds)
    .is("deleted_at", null);
  const map = new Map<string, { membership: number; booking: number; level: number }>();
  for (const c of (data || []) as any[]) {
    if (c.reversed || !["pending", "approved", "paid"].includes(c.status)) continue;
    const amt = Number(c.amount || 0);
    let entry = map.get(c.partner_id);
    if (!entry) { entry = { membership: 0, booking: 0, level: 0 }; map.set(c.partner_id, entry); }
    if (c.source_type === "membership") entry.membership += amt;
    else {
      entry.booking += amt;
      if (Number(c.level || 1) >= 1) entry.level += amt;
    }
  }
  return map;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  const params = request.nextUrl.searchParams;
  const format = params.get("format") || "csv";
  const ids = params.getAll("id").filter((id) => /^[0-9a-f-]{20,}$/i.test(id));
  const dateRange = getDateRange(params.get("range"), params.get("from"), params.get("to"));
  const rows = await loadRows(ids, dateRange);
  const partnerIds = [...new Set(rows.map((r: any) => r.partner_id).filter(Boolean))];
  const incomeMap = await loadIncomeBreakdown(partnerIds);

  const exportRows = rows.map((row: any, index: number) => {
    const partner = Array.isArray(row.partner) ? row.partner[0] : row.partner;
    const profile = profileFrom(partner);
    const method = row.payment_method || (partner?.upi_id ? "upi" : "bank");
    const gross = Number(row.gross_amount || row.amount || 0);
    const deductionRate = Number(row.deduction_rate ?? 0.15);
    const deduction = Number(row.deduction_amount ?? gross * deductionRate);
    const net = Number(row.net_amount || row.amount || gross - deduction);
    const income = incomeMap.get(row.partner_id) || { membership: 0, booking: 0, level: 0 };
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
      upiHolder: "",
      membershipIncome: income.membership,
      bookingIncome: income.booking,
      levelIncome: income.level,
      gross,
      deductionRate,
      deduction,
      net,
      requestDate: row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "",
      paidDate: row.paid_at ? new Date(row.paid_at).toLocaleDateString("en-IN") : "",
      kycStatus: partner?.kyc_status || "",
      payoutStatus: row.status || "",
      adminNote: row.admin_notes || row.transaction_note || "",
      transactionReference: row.transaction_reference || "",
      kiaPayoutId: row.admin_notes?.match(/KIA-\S+/)?.[0] || "",
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
  const bankCount = exportRows.filter((r) => r.paymentMode === "bank").length;
  const upiCount = exportRows.filter((r) => r.paymentMode === "upi").length;
  const statusCounts: Record<string, number> = {};
  for (const row of exportRows) statusCounts[row.payoutStatus] = (statusCounts[row.payoutStatus] || 0) + 1;

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
    // non-fatal
  }

  if (format === "pdf") {
    const headerLines = [
      `Generated: ${generatedAt}`,
      `Generated By: ${(admin as any)?.email || "Admin"}`,
      `Total Partners: ${exportRows.length} (Bank: ${bankCount}, UPI: ${upiCount})`,
      `Gross Total: Rs. ${money(totals.gross)}  |  15% Deduction: Rs. ${money(totals.deduction)}  |  Net Payable: Rs. ${money(totals.net)}`,
      `Status: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
    ];
    const tableHeaders = ["Sr", "Partner", "ID", "Mode", "Gross", "Deduction", "Net", "Status", "KIA Payout ID"];
    const tableRows = exportRows.map((row) => [
      String(row.sr),
      truncate(row.partnerName, 20),
      row.partnerCode,
      row.paymentMode,
      `Rs.${money(row.gross)}`,
      `Rs.${money(row.deduction)}`,
      `Rs.${money(row.net)}`,
      row.payoutStatus,
      truncate(row.kiaPayoutId || row.transactionReference, 22),
    ]);
    const footer = `Prepared by KIA Skin Care Admin  |  Approved By: _______________  Date: ___________`;

    return new NextResponse(buildMultiPagePdf(headerLines, tableHeaders, tableRows, footer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="KIA-Payout-Report-${filenameDate}.pdf"`,
      },
    });
  }

  if (format === "print") {
    const statusSummary = Object.entries(statusCounts).map(([k, v]) => `<span class="badge">${k}: ${v}</span>`).join(" ");
    const body = `<!doctype html><html><head><meta charset="utf-8"><title>KIA Payout Report - ${filenameDate}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#3f3632;font-size:12px}
h1{font-size:18px;color:#3f3632;margin-bottom:4px}
.subtitle{color:#8b7355;margin-bottom:16px}
.meta{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:16px;font-size:11px;color:#666}
.totals{display:flex;gap:24px;margin-bottom:16px;padding:12px;background:#f9f6f0;border-radius:8px;font-weight:600}
.totals .amount{font-size:14px;color:#3f3632}
.totals .label{font-size:10px;color:#8b7355;text-transform:uppercase}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;background:#f0ebe0;font-size:10px;margin-right:4px}
table{border-collapse:collapse;width:100%;font-size:11px;margin-top:8px}
td,th{border:1px solid #e0d8cc;padding:6px 8px;text-align:left}
th{background:#f4eee4;font-weight:600;font-size:10px;text-transform:uppercase;color:#5a4a3a}
.text-right{text-align:right}
.paid{color:#047857}
.rejected{color:#dc2626}
.footer{margin-top:24px;padding-top:16px;border-top:2px solid #e0d8cc;display:flex;justify-content:space-between;font-size:10px;color:#8b7355}
@media print{body{padding:12px}table{font-size:9px}td,th{padding:4px 6px}}
</style></head><body>
<h1>KIA Skin Care — Payout Report</h1>
<p class="subtitle">Generated: ${generatedAt} by ${(admin as any)?.email || "Admin"}</p>
<div class="meta"><span>Partners: ${exportRows.length}</span><span>Bank: ${bankCount}</span><span>UPI: ${upiCount}</span>${statusSummary}</div>
<div class="totals">
<div><div class="label">Gross Total</div><div class="amount">Rs. ${money(totals.gross)}</div></div>
<div><div class="label">15% Deduction</div><div class="amount">Rs. ${money(totals.deduction)}</div></div>
<div><div class="label">Net Payable</div><div class="amount">Rs. ${money(totals.net)}</div></div>
</div>
<table><thead><tr>
<th>Sr</th><th>Partner</th><th>Partner ID</th><th>Mobile</th><th>Mode</th>
<th>Account / UPI</th><th class="text-right">Gross</th><th class="text-right">Deduction</th>
<th class="text-right">Net</th><th>Status</th><th>KIA Payout ID</th><th>Paid Date</th>
</tr></thead><tbody>
${exportRows.map((r) => `<tr>
<td>${r.sr}</td><td>${r.partnerName}</td><td>${r.partnerCode}</td><td>${r.mobile}</td>
<td>${r.paymentMode}</td>
<td>${r.paymentMode === "upi" ? r.maskedUpi : `${r.maskedAccount} ${r.ifsc}`}</td>
<td class="text-right">Rs. ${money(r.gross)}</td><td class="text-right">Rs. ${money(r.deduction)}</td>
<td class="text-right"><strong>Rs. ${money(r.net)}</strong></td>
<td class="${r.payoutStatus === "paid" ? "paid" : r.payoutStatus === "rejected" ? "rejected" : ""}">${r.payoutStatus}</td>
<td style="font-family:monospace;font-size:10px">${r.kiaPayoutId || r.transactionReference}</td><td>${r.paidDate}</td>
</tr>`).join("")}
<tr style="font-weight:700;background:#f4eee4">
<td colspan="6" class="text-right">TOTAL</td>
<td class="text-right">Rs. ${money(totals.gross)}</td><td class="text-right">Rs. ${money(totals.deduction)}</td>
<td class="text-right">Rs. ${money(totals.net)}</td><td colspan="3"></td>
</tr>
</tbody></table>
<div class="footer"><span>Prepared by KIA Skin Care Admin</span><span>Approved By: _______________&nbsp;&nbsp;&nbsp;Date: ___________</span></div>
<script>window.print()</script></body></html>`;
    return new NextResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // CSV Export (default)
  const headers = [
    "Sr. No.", "Partner Name", "Partner ID", "Bank Name", "Account Number", "IFSC Code",
    "Branch Name", "Membership Income", "Kit Booking Income", "Salary Income",
    "Bonus Income", "Level Income", "Gross Amount", "15% Deduction",
    "Net Payable", "KYC Status", "Payout Status", "Payout Date",
    "KIA Payout ID", "Action",
  ];
  const csv = [
    headers.map(csvSanitize).join(","),
    ...exportRows.map((row) => [
      row.sr,
      row.partnerName,
      row.partnerCode,
      row.bankName || (row.paymentMode === "upi" ? "UPI" : ""),
      row.paymentMode === "bank" ? row.accountNumber : row.upiId,
      row.ifsc,
      row.branch,
      money(row.membershipIncome),
      money(row.bookingIncome),
      "", "",
      money(row.levelIncome),
      money(row.gross),
      money(row.deduction),
      money(row.net),
      row.kycStatus,
      row.payoutStatus,
      row.paidDate || row.requestDate,
      row.kiaPayoutId,
      row.payoutStatus,
    ].map(csvSanitize).join(",")),
    [
      "", "", "", "", "", "", "",
      "", "", "", "", "",
      money(totals.gross), money(totals.deduction), money(totals.net),
      "", "", "", "", "",
    ].map(csvSanitize).join(","),
  ].join("\r\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="KIA-Payout-Export-${filenameDate}.csv"`,
    },
  });
}
