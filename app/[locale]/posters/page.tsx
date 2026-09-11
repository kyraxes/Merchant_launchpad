import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PosterStudio } from "@/components/PosterStudio";
import { isLocale, locales } from "@/lib/i18n";
import { MerchantRouteGate } from "@/components/MerchantRouteGate";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function PostersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MerchantRouteGate locale={locale}><><Header locale={locale} /><main className="app-main poster-main"><PosterStudio initialLocale={locale} /></main><Footer /></></MerchantRouteGate>;
}
