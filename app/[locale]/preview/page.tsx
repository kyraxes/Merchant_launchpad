import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftPublicPreview } from "@/components/DraftPublicPreview";
import { isLocale, locales } from "@/lib/i18n";
import { MerchantRouteGate } from "@/components/MerchantRouteGate";

export const metadata: Metadata = { title: "Store preview", robots: { index: false, follow: false } };
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function PreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MerchantRouteGate locale={locale}><DraftPublicPreview locale={locale}/></MerchantRouteGate>;
}
