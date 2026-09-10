import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <OnboardingWizard locale={locale}/>;
}
