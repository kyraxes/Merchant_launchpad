import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { getMerchant, merchants } from "@/data/merchants";
import { copy, isLocale, locales } from "@/lib/i18n";
import { googleMapsSearchUrl, merchantUrl, mockMode } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() { return locales.flatMap((locale) => merchants.map((merchant) => ({ locale, slug: merchant.slug }))); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params; if (!isLocale(locale)) return {};
  const merchant = getMerchant(slug); if (!merchant) return {};
  return {
    title: `${merchant.name[locale]} — ${merchant.category[locale]} · ${merchant.area[locale]}`,
    description: merchant.description[locale],
    alternates: { canonical: merchantUrl(locale, slug), languages: { th: merchantUrl("th", slug), en: merchantUrl("en", slug), "zh-Hans": merchantUrl("zh", slug) } },
    robots: mockMode || merchant.status !== "published" ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function MerchantPage({ params }: PageProps) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const merchant = getMerchant(slug); if (!merchant) notFound();
  const t = copy[locale]; const mapUrl = googleMapsSearchUrl(merchant.name.en, merchant.coordinates.lat, merchant.coordinates.lng);
  const jsonLd = {
    "@context": "https://schema.org", "@type": merchant.categoryId, name: merchant.name[locale],
    alternateName: [merchant.name.th, merchant.name.en, merchant.name.zh].filter((name)=>name!==merchant.name[locale]),
    description: merchant.description[locale], url: merchantUrl(locale, merchant.slug), telephone: merchant.phone,
    priceRange: merchant.priceRange, servesCuisine: merchant.cuisines,
    address: { "@type": "PostalAddress", streetAddress: merchant.address[locale], addressLocality: "Bangkok", addressCountry: "TH" },
    geo: { "@type": "GeoCoordinates", latitude: merchant.coordinates.lat, longitude: merchant.coordinates.lng },
    hasMenu: merchantUrl(locale, merchant.slug)+"#menu",
  };
  return <div className="public-site" style={{ "--accent": merchant.accent, "--accent-soft": merchant.accentSoft } as React.CSSProperties}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
    <header className="public-header"><Link href={`/${locale}/stores/${slug}`}><span>{merchant.emoji}</span><strong>{merchant.name[locale]}</strong></Link><nav>{locales.map((item)=><Link className={locale===item?"active":""} href={`/${item}/stores/${slug}`} key={item}>{item==="zh"?"中":item==="th"?"ไทย":"EN"}</Link>)}</nav></header>
    <main className="public-main">
      <section className="public-hero"><div className="public-art"><span>{merchant.emoji}</span><small>{merchant.category[locale]}</small></div><div className="public-intro"><p className="eyebrow">{merchant.category[locale]} · {merchant.area[locale]}</p><h1>{merchant.name[locale]}</h1><h2>{merchant.tagline[locale]}</h2><p>{merchant.description[locale]}</p><div className="button-row"><a className="primary-button" href={mapUrl} target="_blank" rel="noreferrer"><Icon name="map" size={17}/>{t.directions}</a><a className="secondary-button" href={`tel:${merchant.phone.replace(/\s/g,"")}`}><Icon name="phone" size={17}/>{t.call}</a></div></div></section>
      <section className="public-facts"><article><Icon name="clock"/><div><strong>{t.hours}</strong>{merchant.openingHours.map((period)=><span key={period.hours}>{period.days[locale]} · {period.hours}</span>)}</div></article><article><Icon name="pin"/><div><strong>{t.location}</strong><span>{merchant.address[locale]}</span></div></article><article><Icon name="phone"/><div><strong>{merchant.phone}</strong><span>LINE {merchant.lineId}</span></div></article></section>
      <section className="public-menu" id="menu"><div className="public-section-title"><p className="eyebrow">{t.menu}</p><h2>{t.menu}</h2><span>{merchant.priceRange} · {merchant.cuisines.join(" · ")}</span></div>{merchant.menu.map((section)=><div className="public-menu-group" key={section.id}><h3>{section.name[locale]}</h3><div>{section.items.map((item)=><article key={item.id}><span className="public-dish">{merchant.emoji}</span><div><h4>{item.name[locale]} {item.featured&&<small>{t.featured}</small>}</h4><p>{item.description[locale]}</p></div><strong>฿{item.price}</strong></article>)}</div></div>)}</section>
      <aside className="mock-bar">{t.mockNotice}</aside>
    </main>
    <footer className="public-footer"><strong>{merchant.name[locale]}</strong><span>Powered by Merchant Launchpad · Mock V1</span></footer>
  </div>;
}
