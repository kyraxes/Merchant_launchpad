import type { Metadata } from "next";
import "./globals.css";
import { mockMode, siteUrl } from "@/lib/site";
import { LiffProvider } from "@/components/LiffProvider";
import { MerchantDraftProvider } from "@/components/MerchantDraftProvider";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Merchant Launchpad", template: "%s · Merchant Launchpad" },
  description: "A LINE LIFF App that helps local businesses launch on Google Maps, publish a business website and create product or service posters.",
  robots: mockMode ? { index: false, follow: false } : { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><LiffProvider><MerchantDraftProvider>{children}</MerchantDraftProvider></LiffProvider></body>
    </html>
  );
}
