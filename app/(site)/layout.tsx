import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ReferralTracker from "@/components/ReferralTracker";
import { Suspense } from "react";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
