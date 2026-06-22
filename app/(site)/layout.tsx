import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ReferralTracker from "@/components/ReferralTracker";
import { getPublicContactSettings } from "@/lib/data/public";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactSettings = await getPublicContactSettings();

  return (
    <>
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>
      <Header whatsappUrl={contactSettings.whatsapp} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppFloat whatsappUrl={contactSettings.whatsapp} />
    </>
  );
}
