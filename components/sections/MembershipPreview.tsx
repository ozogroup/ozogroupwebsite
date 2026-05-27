import Link from "next/link";
import { getPublicSiteContent } from "@/lib/data/public";

export default async function MembershipPreview() {
  const siteContent = await getPublicSiteContent("home_membership");
  const heading = siteContent.membership_heading || siteContent.heading || "Become a Premium Referral Partner";
  const description =
    siteContent.membership_description ||
    siteContent.description ||
    siteContent.subtitle ||
    "Experience premium skincare while unlocking an optional earning opportunity through treatment referrals and partner rewards.";
  const ctaText = siteContent.membership_cta_text || siteContent.cta_text || "Book Membership Now";
  const ctaLink = siteContent.membership_cta_link || siteContent.cta_link || "/membership";

  return (
    <section className="section bg-gradient-to-b from-white to-brand-surface/50">
      <div className="container-x">
        <div className="max-w-3xl text-center mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-light/10 border border-brand-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent">
              Premium Partner Program
            </span>
          </div>
          <h2 className="mt-6">{heading}</h2>
          <p className="mt-4 text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-brand-ink via-brand-ink to-brand-muted text-white p-8 md:p-12 shadow-premium">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] uppercase text-white mb-2">
                  Premium Partner Program
                </p>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Earn ₹500 minimum on every successful direct referral
                </h3>
                <p className="text-base text-white leading-relaxed mb-6">
                  Start small and grow unlimited earning potential by sharing trusted skincare 
                  experiences with your network.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={ctaLink}
                    className="inline-flex items-center justify-center rounded-full bg-white text-brand-ink px-6 py-3 text-sm font-semibold hover:bg-brand-surface transition-colors"
                  >
                    {ctaText}
                  </Link>
                  <Link
                    href="/referral"
                    className="inline-flex items-center justify-center rounded-full border border-white/40 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Explore Benefits
                  </Link>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-sm font-semibold text-white mb-4">
                  Membership Price
                </p>
                <p className="text-4xl md:text-5xl font-extrabold mb-2 text-white">₹1,199/-</p>
                <p className="text-sm text-white mb-6">One-time membership</p>
                <div className="space-y-3">
                  {[
                    "Premium referral access",
                    "Real-time reward tracking",
                    "Transparent payout structure",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span className="text-xs font-semibold text-white">
                    Earn starts from ₹500 per direct referral
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-12 flex md:grid gap-3 md:gap-6 md:grid-cols-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
          {[
            {
              icon: "dashboard",
              title: "Premium Referral Access",
              desc: "Access your referral dashboard with real-time earnings tracking",
            },
            {
              icon: "earnings",
              title: "Multi-level Rewards",
              desc: "Earn commissions from direct and network referrals",
            },
            {
              icon: "unlimited",
              title: "Unlimited Potential",
              desc: "No cap on referrals — earn as much as you want",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="min-w-[80%] md:min-w-0 snap-center bg-white border border-brand-border rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-brand-accent/15 to-brand-light/15 text-brand-accent flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon === "dashboard" && (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </>
                  )}
                  {item.icon === "earnings" && (
                    <>
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </>
                  )}
                  {item.icon === "unlimited" && (
                    <>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </>
                  )}
                </svg>
              </div>
              <h3 className="mt-3 md:mt-5 text-sm md:text-lg font-semibold text-brand-ink leading-tight">{item.title}</h3>
              <p className="mt-1.5 md:mt-2 text-xs md:text-sm text-brand-muted leading-relaxed line-clamp-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
