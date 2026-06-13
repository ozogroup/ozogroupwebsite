import NewMembershipRegistrationForm from "@/components/partner/NewMembershipRegistrationForm";
import { requirePartner } from "@/lib/auth/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewMembershipRegistrationPage() {
  const profile = await requirePartner();
  const supabase = await getSupabaseServerClient();
  const { data: partner } = await supabase
    .from("partners" as any)
    .select("partner_code")
    .eq("id", profile.id)
    .single();

  const partnerCode = (partner as any)?.partner_code || "KIA";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Direct Membership</p>
        <h1 className="mt-2 text-3xl font-semibold text-brand-ink">New Membership Registration</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Register a new member directly under your referral network. Admin approval and login support continue through the existing workflow.
        </p>
      </div>
      <NewMembershipRegistrationForm partnerCode={partnerCode} />
    </div>
  );
}
