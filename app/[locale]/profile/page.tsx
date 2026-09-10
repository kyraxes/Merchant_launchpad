import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProfileForm } from "@/components/ProfileForm";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <><Header locale={locale}/><main className="app-main form-main"><ProfileForm locale={locale}/></main><Footer/></>;
}
