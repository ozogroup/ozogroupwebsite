export const dynamic = "force-dynamic";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PartnerShell from "@/components/partner/PartnerShell";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/partner/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "partner") {
    redirect("/unauthorized");
  }

  return <PartnerShell>{children}</PartnerShell>;
}
