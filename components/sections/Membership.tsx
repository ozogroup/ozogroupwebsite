import Link from "next/link";
import { site } from "@/lib/site";

const features = [
  "Access referral dashboard",
  "Track direct referrals",
  "Track earnings in real-time",
  "Track bonus income",
  "View payout status",
];

export default function Membership() {
  return (
    <section id="membership" className="section">
      <div className="container-x">
        <div className="rounded-3xl border border-brand-border bg-white shadow-soft overflow-hidden grid md:grid-cols-12">
          {/* Left — pitch */}
          <div className="md:col-span-7 p-8 md:p-12">
            <span className="eyebrow">Optional Membership</span>
            <h2 className="mt-3">Activate Referral Membership</h2>
            <p className="mt-3 max-w-lg">
              For clients who also want to earn by referring others — this is
              completely optional. Treatments are open to everyone without any
              membership.
            </p>

            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-brand-ink/85">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — price card */}
          <div className="md:col-span-5 bg-gradient-to-br from-brand-primary to-brand-accent text-white p-8 md:p-12 flex flex-col">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-white/80">
              Membership Fee
            </p>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-semibold">
                ₹{site.membershipFee.toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-white/70">/ one-time</span>
            </p>
            <p className="mt-3 text-sm text-white/85">
              Unlock commissions across 4 referral levels + milestone bonuses
              when your referrals get confirmed.
            </p>
            <div className="mt-auto pt-6 grid gap-3">
              <Link
                href="#activate-membership"
                className="inline-flex justify-center rounded-full bg-white text-brand-primary px-5 py-3 text-sm font-semibold hover:bg-brand-surface transition"
              >
                Activate Membership
              </Link>
              <Link
                href="#referrals"
                className="inline-flex justify-center rounded-full border border-white/40 text-white px-5 py-3 text-sm font-medium hover:bg-white/10 transition"
              >
                Learn About Referrals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
