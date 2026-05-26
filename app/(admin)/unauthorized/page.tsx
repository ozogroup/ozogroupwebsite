import Link from "next/link";
import Logo from "@/components/Logo";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-brand-light/45 to-brand-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="bg-brand-card rounded-2xl border border-brand-border shadow-premium p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-brand-ink mb-2">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-brand-muted mb-8">
            You are not authorized to access this page. Please contact your administrator if you believe this is an error.
          </p>

          {/* Button */}
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full bg-brand-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-primaryDark focus:ring-4 focus:ring-brand-primary/20 transition-all"
          >
            Return Home
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 text-sm text-brand-muted">
          &copy; 2026 KIA Skin Care. All rights reserved.
        </div>
      </div>
    </div>
  );
}
