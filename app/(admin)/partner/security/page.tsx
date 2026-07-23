import ChangePasswordForm from "@/components/partner/ChangePasswordForm";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

export default async function PartnerSecurityPage() {
  await requirePartner();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Security</h1>
        <p className="mt-1 text-slate-600">Manage your partner portal password securely.</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
