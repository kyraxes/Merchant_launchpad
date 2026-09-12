import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMenu, getSubmission } from "@/lib/server/submission-store";
import { isLocale, locales } from "@/lib/i18n";
import { menuCopy } from "@/lib/menu-copy";
import { MenuList } from "@/components/MenuList";

export const dynamic = "force-dynamic";
// All menus in this release are pilots; do not index unverified sample content.
export const metadata: Metadata = { title: "Online menu", robots: { index: false, follow: false } };

export default async function PublicMenu({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !/^[a-f0-9]{24}$/.test(slug)) notFound();
  const merchant = await getSubmission(slug);
  if (!merchant || merchant.status !== "approved") notFound();
  const { published } = await getMenu(slug);
  if (!published) notFound();
  const t = menuCopy[locale];
  return <div className="public-site">
    <header className="public-header"><Link href={`/${locale}/stores/${slug}`}>{merchant.name}</Link><nav>{locales.map(lang => <Link key={lang} href={`/${lang}/stores/${slug}/menu`}>{lang === "zh" ? "中" : lang === "th" ? "ไทย" : "EN"}</Link>)}</nav></header>
    <main className="public-main online-menu-page"><Link href={`/${locale}/stores/${slug}`}>← {t.back}</Link><h1>{merchant.name}</h1><p>{merchant.hours}</p>{published.source === "mock" && <aside className="menu-notice">{t.mockPublic}</aside>}<p>{t.viewOnly}</p><MenuList rows={published.rows} locale={locale}/><small>{t.version} {published.version}</small></main>
  </div>;
}
