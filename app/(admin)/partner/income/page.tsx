import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requirePartner } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function PartnerIncomePage() {
  await requirePartner();
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  // Fetch commissions data
  const { data: commissions } = await supabase
    .from("commissions" as any)
    .select("*")
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  // Calculate earnings
  const totalEarnings = (commissions || []).reduce((sum: number, c: any) => sum + (c.amount || c.commission_amount || 0), 0);
  const pendingEarnings = (commissions || []).filter((c: any) => c.status === "pending" || c.status === "approved").reduce((sum: number, c: any) => sum + (c.amount || c.commission_amount || 0), 0);
  const paidEarnings = (commissions || []).filter((c: any) => c.status === "paid").reduce((sum: number, c: any) => sum + (c.amount || c.commission_amount || 0), 0);

  // Fetch payout data
  const { data: payouts } = await supabase
    .from("payouts" as any)
    .select("*")
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  const pendingPayouts = (payouts || []).filter((p: any) => ["pending", "requested", "processing"].includes(p.status)).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Income</h1>
        <p className="text-slate-600">View your earnings and income details</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-ink to-brand-muted rounded-xl shadow-card p-6 text-white">
          <p className="text-sm font-medium mb-2 text-white/90">Total Earnings</p>
          <p className="text-3xl font-bold text-white">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-xs mt-2 text-white/80">Lifetime earnings</p>
        </div>
        <div className="bg-gradient-to-br from-brand-light to-brand-primary rounded-xl shadow-card p-6 text-brand-ink">
          <p className="text-sm font-medium mb-2">Pending Earnings</p>
          <p className="text-3xl font-bold">₹{pendingEarnings.toLocaleString()}</p>
          <p className="text-xs mt-2 opacity-80">Awaiting approval</p>
        </div>
        <div className="bg-gradient-to-br from-brand-ink to-brand-muted rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm font-medium mb-2 text-white/90">Paid Earnings</p>
          <p className="text-3xl font-bold text-white">₹{paidEarnings.toLocaleString()}</p>
          <p className="text-xs mt-2 text-white/80">Successfully paid</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Wallet Balance</h2>
        <div className="flex flex-col gap-4 p-6 bg-brand-accent/10 rounded-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-brand-accent">₹{pendingEarnings.toLocaleString()}</p>
          </div>
          <a
            href="/partner/payouts"
            className="px-6 py-3 bg-brand-accent text-center text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors"
          >
            Request Payout
          </a>
        </div>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission History</h2>
        {commissions && commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((commission: any) => (
                  <tr key={commission.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(commission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">{commission.source || 'Treatment booking'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">Level {commission.level || 1}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600">₹{(commission.amount || commission.commission_amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        commission.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : commission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {commission.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No commissions yet. Start sharing your referral link to earn!</p>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payout History</h2>
        {payouts && payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout: any) => (
                  <tr key={payout.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(payout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-brand-ink">₹{(payout.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{payout.payment_method || payout.method || 'Bank Transfer'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payout.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : payout.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : payout.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {payout.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No payouts yet. Request a payout when you have available balance.</p>
          </div>
        )}
      </div>
    </div>
  );
}
