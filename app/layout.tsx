import type { Metadata } from "next";
import "./globals.css";
import { mockMode, siteUrl } from "@/lib/site";
import { LiffProvider } from "@/components/LiffProvider";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Thai Merchant Launchpad", template: "%s · Thai Merchant Launchpad" },
  description: "A LINE MINI App prototype that helps Thai merchants launch on Google Maps, publish a store website and create product posters.",
  robots: mockMode ? { index: false, follow: false } : { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><LiffProvider>{children}</LiffProvider></body>
    </html>
  );
}
