import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Membership | KIA Skin Care Partner Program",
  description: "Join the KIA Skin Care Partner Program. Book your membership and start earning commissions.",
  alternates: { canonical: "/membership" },
};

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
