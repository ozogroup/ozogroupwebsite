import Hero from "@/components/sections/Hero";
import TrustBadges from "@/components/sections/TrustBadges";
import Treatments from "@/components/sections/Treatments";
import ConsultationBanner from "@/components/sections/ConsultationBanner";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import Referrals from "@/components/sections/Referrals";
import Membership from "@/components/sections/Membership";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBadges />
      <Treatments />
      <ConsultationBanner />
      <WhyChooseUs />
      <HowItWorks />
      <Referrals />
      <Membership />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
