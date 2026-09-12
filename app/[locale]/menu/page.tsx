import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { MerchantRouteGate } from "@/components/MerchantRouteGate";
import { MenuStudio } from "@/components/MenuStudio";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Menu studio", robots: { index: false, follow: false } };

export default async function MenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MerchantRouteGate locale={locale}><Header locale={locale}/><main className="app-main form-main"><MenuStudio locale={locale}/></main></MerchantRouteGate>;
}
