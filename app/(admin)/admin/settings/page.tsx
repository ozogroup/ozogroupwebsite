import { requireAdmin } from "@/lib/auth/helpers";

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Configure application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="+91 12345 67890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Number</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="+91 12345 67890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="contact@ozo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <textarea
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                rows={3}
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Social Links</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Instagram</label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="https://instagram.com/ozo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Facebook</label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="https://facebook.com/ozo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">YouTube</label>
              <input
                type="url"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                placeholder="https://youtube.com/@ozo"
              />
            </div>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Referral Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 1 Commission (%)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                defaultValue="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 2 Commission (%)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                defaultValue="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 3 Commission (%)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                defaultValue="1.7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Level 4 Commission (%)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                defaultValue="1.2"
              />
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Payout Amount (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                defaultValue="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payout Processing Time (days)</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none"
                defaultValue="7"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
