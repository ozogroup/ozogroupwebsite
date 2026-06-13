import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

async function updateProfile(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");
  const full_name = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  if (!full_name) redirect("/partner/profile?error=Name is required");
  await supabase.from("profiles").update({ full_name, phone, updated_at: new Date().toISOString() }).eq("id", user.id);
  await supabase.from("partners" as any).update({ city, updated_at: new Date().toISOString() }).eq("id", user.id);
  revalidatePath("/partner/profile");
  redirect("/partner/profile?success=Profile updated");
}

export default async function PartnerProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requirePartner();
  const resolvedSearchParams = await searchParams;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>User not found</div>;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const { data: partner } = await supabase.from("partners" as any).select("partner_code, city, status").eq("id", user.id).maybeSingle();
  const profileData = profile as any;
  const partnerData = partner as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600">Manage your partner profile</p>
      </div>

      {resolvedSearchParams.error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700">{resolvedSearchParams.error}</p></div>}
      {resolvedSearchParams.success && <div className="p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-700">{resolvedSearchParams.success}</p></div>}

      <form action={updateProfile} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input name="full_name" type="text" defaultValue={profileData?.full_name || ""} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input name="phone" type="tel" defaultValue={profileData?.phone || ""} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue={user.email}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input name="city" type="text" defaultValue={partnerData?.city || ""} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Partner Code</label>
            <input
              type="text"
              defaultValue={partnerData?.partner_code || ""}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 outline-none"
            />
          </div>
        </div>
        <div className="mt-6">
          <button type="submit" className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
