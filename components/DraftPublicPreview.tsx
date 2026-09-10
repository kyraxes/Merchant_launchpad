"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";
import { localizedValue } from "@/lib/merchant-draft";

const text = {
  th: { mock: "ตัวอย่างจากข้อมูลในอุปกรณ์นี้ ยังไม่ใช่หน้า SEO ที่เผยแพร่จริง", back: "กลับไปแก้ไข", hours: "เวลาเปิด", address: "ที่ตั้ง", contact: "ติดต่อ", menu: "เมนู" },
  en: { mock: "Device-only preview. This is not a live, indexable SEO page.", back: "Back to editor", hours: "Opening hours", address: "Location", contact: "Contact", menu: "Menu" },
  zh: { mock: "这是当前设备生成的预览，不是真正发布并可被搜索引擎收录的SEO页面。", back: "返回编辑", hours: "营业时间", address: "店铺位置", contact: "联系方式", menu: "菜单" },
};

export function DraftPublicPreview({ locale }: { locale: Locale }) {
  const { draft } = useMerchantDraft();
  const t = text[locale];
  return (
    <div className="public-site" style={{ "--accent": draft.accent, "--accent-soft": draft.accentSoft } as React.CSSProperties}>
      <header className="public-header"><Link href={`/${locale}/website`}><span>{draft.emoji}</span><strong>{localizedValue(draft.name, locale)}</strong></Link><nav><Link href="/th/preview">ไทย</Link><Link href="/en/preview">EN</Link><Link href="/zh/preview">中</Link></nav></header>
      <main className="public-main">
        <aside className="mock-bar">{t.mock}</aside>
        <section className="public-hero">
          <div className="public-art">{draft.images.storefront ? <img src={draft.images.storefront} alt=""/> : <span>{draft.emoji}</span>}<small>MOCK PREVIEW</small></div>
          <div className="public-intro"><p className="eyebrow">{localizedValue(draft.category, locale)}</p><h1>{localizedValue(draft.name, locale)}</h1><h2>{localizedValue(draft.tagline, locale)}</h2><p>{localizedValue(draft.address, locale)}</p><div className="button-row"><Link className="primary-button" href={`/${locale}/profile`}>{t.back}</Link></div></div>
        </section>
        <section className="public-facts"><article><Icon name="clock"/><div><strong>{t.hours}</strong><span>{draft.hours || "—"}</span></div></article><article><Icon name="pin"/><div><strong>{t.address}</strong><span>{localizedValue(draft.address, locale) || "—"}</span></div></article><article><Icon name="phone"/><div><strong>{t.contact}</strong><span>{draft.phone || draft.lineId || "—"}</span></div></article></section>
        <section className="public-menu"><div className="public-section-title"><h2>{t.menu}</h2></div>{draft.menu.map((section) => <div className="public-menu-group" key={section.id}><h3>{section.name[locale]}</h3><div>{section.items.map((item) => <article key={item.id}>{draft.images.product ? <img className="public-dish-image" src={draft.images.product} alt=""/> : <span className="public-dish">{draft.emoji}</span>}<div><h4>{item.name[locale]}</h4><p>{item.description[locale]}</p></div><strong>฿{item.price}</strong></article>)}</div></div>)}</section>
      </main>
    </div>
  );
}
