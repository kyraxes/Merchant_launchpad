import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { getMerchant, merchants } from "@/data/merchants";
import { copy, isLocale, locales } from "@/lib/i18n";
import { getMenu, getSubmission } from "@/lib/server/submission-store";
import { googleMapsAddressUrl, googleMapsSearchUrl, merchantUrl, mockMode } from "@/lib/site";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() { return locales.flatMap((locale) => merchants.map((merchant) => ({ locale, slug: merchant.slug }))); }

async function getApprovedSubmission(slug: string) {
  if (!/^[a-f0-9]{24}$/.test(slug)) return null;
  const submission = await getSubmission(slug);
  return submission?.status === "approved" ? submission : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params; if (!isLocale(locale)) return {};
  const merchant = getMerchant(slug);
  if (!merchant) {
    const submission = await getApprovedSubmission(slug);
    if (!submission) return {};
    return {
      title: `${submission.name} — ${submission.category}`,
      description: `${submission.name}, ${submission.category}. ${submission.address}.`,
      alternates: { canonical: merchantUrl(submission.locale, submission.id) },
      robots: mockMode ? { index: false, follow: false } : { index: true, follow: true },
    };
  }
  return {
    title: `${merchant.name[locale]} — ${merchant.category[locale]} · ${merchant.area[locale]}`,
    description: merchant.description[locale],
    alternates: { canonical: merchantUrl(locale, slug), languages: { th: merchantUrl("th", slug), en: merchantUrl("en", slug), "zh-Hans": merchantUrl("zh", slug) } },
    robots: mockMode || merchant.status !== "published" ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function MerchantPage({ params }: PageProps) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const merchant = getMerchant(slug);
  if (!merchant) {
    const submission = await getApprovedSubmission(slug);
    if (!submission) notFound();
    return <ApprovedMerchantPage locale={locale} submission={submission}/>;
  }
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

const publishedCopy = {
  th: { about: "ข้อมูลธุรกิจ", hours: "เวลาเปิด", location: "ที่ตั้ง", call: "โทร", map: "เปิดใน Google Maps", contact: "ติดต่อ", gallery: "สินค้า บริการ และข้อมูลราคา", notice: "หน้าธุรกิจนี้เผยแพร่หลังผ่านการตรวจสอบแล้ว" },
  en: { about: "Business information", hours: "Opening hours", location: "Location", call: "Call", map: "Open in Google Maps", contact: "Contact", gallery: "Products, services and price information", notice: "This business page was published after review." },
  zh: { about: "商户信息", hours: "营业时间", location: "商户地址", call: "电话联系", map: "在Google Maps打开", contact: "联系方式", gallery: "商品、服务与价目信息", notice: "该商户资料已通过审核并公开发布。" },
};

async function ApprovedMerchantPage({ locale, submission }: { locale: "th" | "en" | "zh"; submission: NonNullable<Awaited<ReturnType<typeof getApprovedSubmission>>> }) {
  const t = publishedCopy[locale];
  const { published: publishedMenu } = await getMenu(submission.id);
  const mapUrl = googleMapsAddressUrl(submission.name, submission.address);
  const imageUrl = (kind: "storefront" | "menu" | "product") => `/api/public/merchants/${submission.id}/images/${kind}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: submission.name,
    description: `${submission.name}, ${submission.category}.`,
    url: merchantUrl(locale, submission.id),
    telephone: submission.phone,
    address: { "@type": "PostalAddress", streetAddress: submission.address, addressCountry: "TH" },
    openingHours: submission.hours,
  };
  return <div className="public-site" style={{ "--accent": "#147d64", "--accent-soft": "#e7f5ef" } as React.CSSProperties}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
    <header className="public-header"><Link href={`/${locale}/stores/${submission.id}`}><span>🏪</span><strong>{submission.name}</strong></Link><nav>{locales.map((item)=><Link className={locale===item?"active":""} href={`/${item}/stores/${submission.id}`} key={item}>{item==="zh"?"中":item==="th"?"ไทย":"EN"}</Link>)}</nav></header>
    <main className="public-main">
      <section className="public-hero">
        <div className="public-art">{submission.imageKeys.storefront ? <img src={imageUrl("storefront")} alt={submission.name}/> : <span>🏪</span>}<small>{submission.category}</small></div>
        <div className="public-intro"><p className="eyebrow">{t.about}</p><h1>{submission.name}</h1><h2>{submission.category}</h2><p>{t.notice}</p><div className="button-row"><a className="primary-button" href={mapUrl} target="_blank" rel="noreferrer"><Icon name="map" size={17}/>{t.map}</a><a className="secondary-button" href={`tel:${submission.phone.replace(/\s/g,"")}`}><Icon name="phone" size={17}/>{t.call}</a></div></div>
      </section>
      <section className="public-facts"><article><Icon name="clock"/><div><strong>{t.hours}</strong><span>{submission.hours}</span></div></article><article><Icon name="pin"/><div><strong>{t.location}</strong><span>{submission.address}</span></div></article><article><Icon name="phone"/><div><strong>{t.contact}</strong><span>{submission.phone}{submission.lineId ? ` · LINE ${submission.lineId}` : ""}</span></div></article></section>
      {publishedMenu && <section className="form-card"><Link className="primary-button" href={`/${locale}/stores/${submission.id}/menu`}>{locale === "zh" ? "查看线上菜单" : locale === "th" ? "ดูเมนูออนไลน์" : "View online menu"}<Icon name="arrow"/></Link></section>}
      {(submission.imageKeys.menu || submission.imageKeys.product) && <section className="public-menu"><div className="public-section-title"><p className="eyebrow">{submission.category}</p><h2>{t.gallery}</h2></div><div className="public-business-gallery">{submission.imageKeys.menu && <img src={imageUrl("menu")} alt={t.gallery}/>} {submission.imageKeys.product && <img src={imageUrl("product")} alt={t.gallery}/>}</div></section>}
      {mockMode && <aside className="mock-bar">Pilot mode · Search engine indexing is currently disabled</aside>}
    </main>
    <footer className="public-footer"><strong>{submission.name}</strong><span>Powered by Merchant Launchpad</span></footer>
  </div>;
}
