export const dynamic = "force-dynamic";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PartnerShell from "@/components/partner/PartnerShell";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/partner/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "partner") {
    redirect("/unauthorized");
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("partner_code, status, wallet_balance, total_earnings, kyc_status")
    .eq("id", user.id)
    .maybeSingle();

  const walletBalance =
    typeof partner?.wallet_balance === "number"
      ? partner.wallet_balance
      : Number(partner?.wallet_balance ?? 0) || 0;
  const totalEarnings =
    typeof partner?.total_earnings === "number"
      ? partner.total_earnings
      : Number(partner?.total_earnings ?? 0) || 0;

  const partnerInfo = partner
    ? {
        full_name: profile.full_name ?? null,
        partner_code: partner.partner_code ?? null,
        wallet_balance: walletBalance,
        total_earnings: totalEarnings,
        status: partner.status ?? null,
        kyc_status: partner.kyc_status ?? null,
      }
    : null;

  return (
    <PartnerShell partnerInfo={partnerInfo}>
      {children}
    </PartnerShell>
  );
}
