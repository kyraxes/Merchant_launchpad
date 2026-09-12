import type { Metadata } from "next";
import "./globals.css";
import { mockMode, siteUrl } from "@/lib/site";
import { AccountProvider } from "@/components/AccountProvider";
import { MerchantDraftProvider } from "@/components/MerchantDraftProvider";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Merchant Launchpad", template: "%s · Merchant Launchpad" },
  description: "Create your business website and online menu, prepare Google Maps information and share product posters.",
  robots: mockMode ? { index: false, follow: false } : { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AccountProvider><MerchantDraftProvider>{children}</MerchantDraftProvider></AccountProvider></body>
    </html>
  );
}
