export const dynamic = 'force-dynamic';

export default async function PartnerSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support</h1>
        <p className="text-slate-600">Get help with your partner account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Support</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none">
                <option value="">Select subject</option>
                <option value="payout">Payout Issue</option>
                <option value="commission">Commission Issue</option>
                <option value="account">Account Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
              <textarea
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                rows={5}
                placeholder="Describe your issue..."
              />
            </div>
            <button className="w-full px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 transition-colors">
              Submit Request
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-2xl">📞</span>
              <div>
                <p className="font-medium text-slate-900">Phone</p>
                <p className="text-sm text-slate-600">+91 12345 67890</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-medium text-slate-900">WhatsApp</p>
                <p className="text-sm text-slate-600">+91 12345 67890</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-medium text-slate-900">Email</p>
                <p className="text-sm text-slate-600">support@ozo.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🕐</span>
              <div>
                <p className="font-medium text-slate-900">Support Hours</p>
                <p className="text-sm text-slate-600">Mon - Sat: 9 AM - 6 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Previous Requests</h2>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No support requests found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
