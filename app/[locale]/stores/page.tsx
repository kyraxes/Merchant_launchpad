import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";
import { listSubmissions } from "@/lib/server/submission-store";
import { mockMode } from "@/lib/site";

export const dynamic = "force-dynamic";

const text = {
  th: { title: "ธุรกิจท้องถิ่น", body: "ร้านค้า ร้านอาหาร และผู้ให้บริการที่เผยแพร่แล้ว", empty: "ยังไม่มีธุรกิจที่เผยแพร่" },
  en: { title: "Local businesses", body: "Published shops, restaurants and service businesses", empty: "No businesses have been published yet." },
  zh: { title: "本地商户", body: "已经发布的商店、餐厅和服务类商户", empty: "还没有已发布商户" },
};

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: text[locale].title, description: text[locale].body, robots: mockMode ? { index: false, follow: false } : { index: true, follow: true } };
}

export default async function PublishedBusinessesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const live = (await listSubmissions()).filter((item) => item.status === "approved");
  const t = text[locale];
  return <main className="directory-shell"><header><p className="eyebrow">MERCHANT LAUNCHPAD</p><h1>{t.title}</h1><p>{t.body}</p></header><section className="directory-grid">
    {live.map((item) => <Link href={`/${locale}/stores/${item.id}`} key={item.id}><span>🏪</span><div><small>{item.category}</small><h2>{item.name}</h2><p>{item.address}</p></div></Link>)}
    {!live.length && <p>{t.empty}</p>}
  </section></main>;
}
