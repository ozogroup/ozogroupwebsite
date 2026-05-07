import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import TrustBadges from "@/components/sections/TrustBadges";
import Treatments from "@/components/sections/Treatments";
import KoreanGlassHighlight from "@/components/sections/KoreanGlassHighlight";
import ConsultationBanner from "@/components/sections/ConsultationBanner";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import MembershipPreview from "@/components/sections/MembershipPreview";
import EarningsHighlight from "@/components/sections/EarningsHighlight";
import Referrals from "@/components/sections/Referrals";
import Membership from "@/components/sections/Membership";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "OZO Skin Care · Premium Luxury Skincare Treatments",
  description: "Experience premium luxury skincare treatments at OZO Skin Care. Doctor-supervised Korean and Japanese skincare protocols for visible, lasting results.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBadges />
      <Treatments />
      <KoreanGlassHighlight />
      <ConsultationBanner />
      <WhyChooseUs />
      <HowItWorks />
      <MembershipPreview />
      <EarningsHighlight />
      <Referrals />
      <Membership />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
