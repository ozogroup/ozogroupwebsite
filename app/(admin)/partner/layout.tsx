export const dynamic = "force-dynamic";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import PartnerShell from "@/components/partner/PartnerShell";

export const dynamic = 'force-dynamic';

const PUBLIC_PATHS = ["/partner/login", "/partner/forgot-password", "/partner/reset-password"];

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-pathname") || "";
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/partner/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "partner") {
    redirect("/unauthorized");
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("partner_code, status, wallet_balance")
    .eq("id", user.id)
    .single();

  const partnerInfo = partner ? {
    full_name: (profile as any).full_name || null,
    partner_code: (partner as any).partner_code || null,
    wallet_balance: (partner as any).wallet_balance || 0,
    status: (partner as any).status || null,
  } : null;

  return <PartnerShell partnerInfo={partnerInfo}>{children}</PartnerShell>;
}
