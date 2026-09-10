import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PosterStudio } from "@/components/PosterStudio";
import { merchants } from "@/data/merchants";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function PostersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <><Header locale={locale} /><main className="app-main poster-main"><PosterStudio merchant={merchants[0]} initialLocale={locale} /></main><Footer /></>;
}
