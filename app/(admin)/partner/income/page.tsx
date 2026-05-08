export const dynamic = 'force-dynamic';

export default async function PartnerIncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Income</h1>
        <p className="text-slate-600">View your earnings and income details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm font-medium mb-2">Total Earnings</p>
          <p className="text-3xl font-bold">₹0</p>
          <p className="text-xs mt-2 opacity-80">Lifetime earnings</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm font-medium mb-2">Pending Earnings</p>
          <p className="text-3xl font-bold">₹0</p>
          <p className="text-xs mt-2 opacity-80">Awaiting approval</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm font-medium mb-2">Paid Earnings</p>
          <p className="text-3xl font-bold">₹0</p>
          <p className="text-xs mt-2 opacity-80">Successfully paid</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Wallet Balance</h2>
        <div className="flex items-center justify-between p-6 bg-brand-accent/10 rounded-lg">
          <div>
            <p className="text-sm text-slate-600 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-brand-accent">₹0</p>
          </div>
          <button className="px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors">
            Request Payout
          </button>
        </div>
      </div>
    </div>
  );
}
