import { adminLogin } from "@/lib/auth/actions";
import Logo from "@/components/Logo";

export const dynamic = 'force-dynamic';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-slate-600">
              Secure access for authorized staff
            </p>
          </div>

          {/* Error Message */}
          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{searchParams.error}</p>
            </div>
          )}

          {/* Form */}
          <form action={adminLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
                placeholder="admin@ozo.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-accent to-brand-light text-white font-semibold py-3 px-4 rounded-lg hover:from-brand-accent/90 hover:to-brand-light/90 focus:ring-4 focus:ring-brand-accent/20 transition-all"
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-sm text-slate-600 hover:text-brand-accent transition-colors"
            >
              ← Back to website
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 text-sm text-slate-500">
          © {new Date().getFullYear()} OZO / IA Skin Care. All rights reserved.
        </div>
      </div>
    </div>
  );
}
