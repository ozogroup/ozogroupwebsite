"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center section">
          <div className="container-x">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Message Sent
                </span>
              </div>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-accent to-brand-light text-white flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl text-brand-ink mb-4">
                Thank You for Reaching Out
              </h1>
              <p className="text-lg text-brand-muted mb-8 leading-relaxed">
                Your message has been sent successfully. Our team will get back to you 
                within 24 hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  Back to Home
                </Link>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary justify-center"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
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
                  Contact Us
                </span>
              </div>
              <h1 className="mt-6">
                Get in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-light">
                  Touch
                </span>
              </h1>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl leading-relaxed">
                Have questions about our treatments or membership program? We're here to help. 
                Reach out to us and we'll respond within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="section bg-gradient-to-b from-white to-brand-surface/50">
          <div className="container-x">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="card">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 8.92z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-ink">Phone</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  <a href={`tel:${site.phoneRaw}`} className="hover:text-brand-accent transition-colors">
                    {site.phone}
                  </a>
                </p>
              </div>

              <div className="card">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9L21 11.5z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-ink">WhatsApp</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  <a
                    href={site.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-accent transition-colors"
                  >
                    Chat with us
                  </a>
                </p>
              </div>

              <div className="card">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-ink">Instagram</h3>
                <p className="mt-2 text-sm text-brand-muted">
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-accent transition-colors"
                  >
                    @ia_korean_gloh_tretment
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="section">
          <div className="container-x">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl border border-brand-border/60 shadow-premium p-8 md:p-12">
                <h2 className="text-2xl font-semibold text-brand-ink mb-6">
                  Send us a message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-ink mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Your name"
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
                    <label htmlFor="subject" className="block text-sm font-medium text-brand-ink mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                    >
                      <option value="">Select a subject</option>
                      <option value="booking">Treatment Booking</option>
                      <option value="membership">Membership Inquiry</option>
                      <option value="consultation">Free Consultation</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-brand-ink mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-brand-border/60 bg-white text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="section bg-gradient-to-b from-brand-surface/50 to-white">
          <div className="container-x">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
                  Visit Our Clinic
                </span>
              </div>
              <h2 className="mt-6">Book Your Consultation Today</h2>
              <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                Ready to transform your skin? Book a free consultation with our skincare experts 
                and discover the perfect treatment for your unique needs.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  Book Consultation on WhatsApp
                </a>
                <a
                  href={`tel:${site.phoneRaw}`}
                  className="btn-secondary justify-center"
                >
                  Call {site.phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
