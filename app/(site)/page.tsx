import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import TrustBadges from "@/components/sections/TrustBadges";
import Treatments from "@/components/sections/Treatments";
import TreatmentBenefits from "@/components/sections/TreatmentBenefits";
import KoreanGlassHighlight from "@/components/sections/KoreanGlassHighlight";
import ConsultationBanner from "@/components/sections/ConsultationBanner";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import Membership from "@/components/sections/Membership";
import EarningsHighlight from "@/components/sections/EarningsHighlight";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import FranchiseInquiry from "@/components/sections/FranchiseInquiry";
import FinalCTA from "@/components/sections/FinalCTA";
import { site } from "@/lib/site";
import { getPublicSiteContent } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "KIA Skin Care | Premium Skincare & Partner Program",
  description: "Premium skincare kits, Korean glass treatment campaign, and partner referral program by KIA Skin Care.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const franchiseContent = await getPublicSiteContent("franchise");
  return (
    <>
      <Hero />
      <TrustBadges />
      <Treatments />
      <TreatmentBenefits />
      <KoreanGlassHighlight />
      <ConsultationBanner />
      <WhyChooseUs />
      <HowItWorks />
      <Membership />
      <EarningsHighlight />
      <Testimonials />
      <FAQ />
      <FranchiseInquiry
        title={franchiseContent.franchise_title}
        subtitle={franchiseContent.franchise_subtitle}
        image={franchiseContent.franchise_image}
      />
      <FinalCTA />
    </>
  );
}
