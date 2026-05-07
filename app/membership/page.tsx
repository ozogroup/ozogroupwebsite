"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

export default function MembershipPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    city: "",
    address: "",
    pinCode: "",
    referralCode: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <>
        <main className="min-h-screen flex items-center justify-center section">
          <div className="container-x">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Success
                </span>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-accent to-brand-light text-white flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl text-brand-ink mb-4">
                Welcome to OZO Premium Partnership
              </h1>
              <p className="text-lg text-brand-muted mb-8 leading-relaxed">
                Your membership request has been submitted successfully. Our team will contact you 
                for confirmation shortly.
              </p>

              <div className="bg-gradient-to-br from-brand-surface to-white rounded-3xl border border-brand-border/60 p-8 shadow-soft mb-8">
                <h2 className="text-xl font-semibold text-brand-ink mb-4">Next Steps</h2>
                <ul className="text-left space-y-4 text-brand-muted">
                  <li className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent mt-0.5 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span>Our team will contact you for confirmation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent mt-0.5 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span>Referral code will be generated after approval</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent mt-0.5 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span>Minimum ₹500 referral reward per successful membership</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  Share on WhatsApp
                </a>
                <Link
                  href="/"
                  className="btn-secondary justify-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at 80% 0%, rgba(27,163,198,0.15) 0%, rgba(255,255,255,0) 50%), radial-gradient(ellipse at 20% 100%, rgba(93,169,214,0.12) 0%, rgba(255,255,255,0) 50%)",
            }}
          />
          <div className="container-x pt-12 md:pt-16 pb-16 md:pb-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Membership Booking
                </span>
              </div>
              <h1 className="mt-6">
                Book Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                  Premium Partnership
                </span>
              </h1>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl leading-relaxed">
                Join the OZO Skin Care Premium Referral Partner Program for just ₹1,199 
                and start earning commissions from your very first referral.
              </p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="section bg-gradient-to-b from-white to-brand-surface/50">
          <div className="container-x">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl border border-brand-border/60 shadow-premium p-8 md:p-12">
                <div className="mb-8 pb-8 border-b border-brand-border/60">
                  <h2 className="text-2xl font-semibold text-brand-ink mb-2">
                    Membership Details
                  </h2>
                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-semibold text-brand-primary">₹1,199</p>
                    <span className="text-brand-muted">one-time membership fee</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-brand-ink mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-brand-ink mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-ink mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-brand-ink mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Enter your city"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-brand-ink mb-2">
                      Full Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all resize-none"
                      placeholder="Enter your full address"
                    />
                  </div>

                  <div>
                    <label htmlFor="pinCode" className="block text-sm font-medium text-brand-ink mb-2">
                      Pin Code *
                    </label>
                    <input
                      type="text"
                      id="pinCode"
                      name="pinCode"
                      required
                      value={formData.pinCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Enter your pin code"
                    />
                  </div>

                  <div>
                    <label htmlFor="referralCode" className="block text-sm font-medium text-brand-ink mb-2">
                      Referral Code (Optional)
                    </label>
                    <input
                      type="text"
                      id="referralCode"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Enter referral code if you have one"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-brand-ink mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all resize-none"
                      placeholder="Any additional notes or questions"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                  >
                    Book Membership · ₹1,199
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-brand-muted">
                  By submitting, you agree to our terms and conditions. Our team will contact you 
                  for payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
