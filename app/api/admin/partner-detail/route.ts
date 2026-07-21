import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const partnerId = request.nextUrl.searchParams.get("id");
  if (!partnerId || !/^[0-9a-f-]{20,}$/i.test(partnerId)) {
    return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const [{ data: partner }, { data: commissions }, { data: payouts }] = await Promise.all([
    supabase
      .from("partners" as any)
      .select(`
        id, partner_code, status, kyc_status, bank_verified,
        wallet_balance, total_earnings, paid_earnings,
        bank_account_holder, bank_account_number, bank_ifsc, bank_name, bank_branch_name,
        upi_id, sponsor_code, created_at,
        profiles(full_name, email, phone, city)
      `)
      .eq("id", partnerId)
      .maybeSingle(),
    supabase
      .from("commissions" as any)
      .select("amount, level, source_type, status, reversed, deleted_at")
      .eq("partner_id", partnerId)
      .is("deleted_at", null)
      .eq("reversed", false),
    supabase
      .from("payouts" as any)
      .select("id, amount, gross_amount, deduction_amount, net_amount, status, created_at, paid_at, admin_notes, transaction_reference, payment_method")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const profile = Array.isArray((partner as any).profiles) ? (partner as any).profiles[0] : (partner as any).profiles;
  const p = partner as any;

  // KYC documents (signed URLs)
  let documents: { type: string; url: string }[] = [];
  try {
    const { data: kyc } = await supabase
      .from("partner_kyc" as any)
      .select("pan_card_path, aadhaar_front_path, aadhaar_back_path, selfie_path, cheque_path")
      .eq("partner_id", partnerId)
      .maybeSingle();
    if (kyc) {
      const k = kyc as any;
      const paths = [
        { type: "pan_card", path: k.pan_card_path },
        { type: "aadhaar_front", path: k.aadhaar_front_path },
        { type: "aadhaar_back", path: k.aadhaar_back_path },
        { type: "selfie", path: k.selfie_path },
        { type: "cheque_or_passbook", path: k.cheque_path },
      ].filter((d) => d.path);

      const urls = await Promise.all(
        paths.map(async (d) => {
          const bucket = d.path.startsWith("partners/") ? "partner-kyc-private" : "kyc-documents";
          const { data } = await supabase.storage.from(bucket).createSignedUrl(d.path, 600);
          return data?.signedUrl ? { type: d.type, url: data.signedUrl } : null;
        })
      );
      documents = urls.filter(Boolean) as { type: string; url: string }[];
    }
  } catch {
    // partner_kyc table may not exist
  }

  // Income breakdown by source
  const activeCommissions = (commissions || []).filter((c: any) => !c.reversed && !c.deleted_at);
  const approvedCommissions = activeCommissions.filter((c: any) => ["approved", "paid"].includes(c.status));
  const membershipIncome = approvedCommissions.filter((c: any) => c.source_type === "membership").reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const bookingIncome = approvedCommissions.filter((c: any) => c.source_type === "booking").reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const l1 = approvedCommissions.filter((c: any) => c.level === 1).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const l2 = approvedCommissions.filter((c: any) => c.level === 2).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const l3 = approvedCommissions.filter((c: any) => c.level === 3).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const l4 = approvedCommissions.filter((c: any) => c.level === 4).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

  const pendingPayoutAmount = (payouts || [])
    .filter((p: any) => ["requested", "processing"].includes(p.status))
    .reduce((s: number, p: any) => s + Number(p.net_amount || p.amount || 0), 0);

  const recentPayouts = (payouts || []).slice(0, 5).map((py: any) => ({
    id: py.id,
    gross: py.gross_amount || py.amount,
    deduction: py.deduction_amount,
    net: py.net_amount || py.amount,
    status: py.status,
    date: py.paid_at
      ? new Date(py.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : new Date(py.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    kia_payout_id: py.admin_notes?.match(/KIA-\S+/)?.[0] || null,
  }));

  return NextResponse.json({
    name: profile?.full_name || "",
    partner_code: p.partner_code,
    phone: profile?.phone || "",
    email: profile?.email || "",
    city: profile?.city || "",
    status: p.status,
    kyc_status: p.kyc_status || "not_submitted",
    sponsor_code: p.sponsor_code || "",
    joined: p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
    payment_method: p.upi_id ? "upi" : "bank",
    bank_holder: p.bank_account_holder,
    bank_account: p.bank_account_number,
    bank_ifsc: p.bank_ifsc,
    bank_name: p.bank_name,
    bank_branch: p.bank_branch_name,
    upi_id: p.upi_id,
    wallet_balance: p.wallet_balance,
    total_earnings: p.total_earnings,
    paid_earnings: p.paid_earnings,
    pending_payouts: pendingPayoutAmount,
    documents,
    income_breakdown: [
      { label: "Membership (L1-L4)", amount: membershipIncome },
      { label: "Kit Booking (L1-L4)", amount: bookingIncome },
      { label: "Level 1", amount: l1 },
      { label: "Level 2", amount: l2 },
      { label: "Level 3", amount: l3 },
      { label: "Level 4", amount: l4 },
    ],
    recent_payouts: recentPayouts,
  });
}
