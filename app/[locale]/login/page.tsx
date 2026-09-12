import { notFound } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";
import { isLocale } from "@/lib/i18n";
export const metadata = { title: "Account", robots: { index: false, follow: false } };
export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); return <AccountForm locale={locale}/>;
}
