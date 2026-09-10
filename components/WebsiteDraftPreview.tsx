"use client";

import Link from "next/link";
import type { Locale, Merchant } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";

const text = {
  th: { url: "ที่อยู่เว็บไซต์", view: "เปิดเว็บไซต์ตัวอย่าง", edit: "แก้ไขเนื้อหา" },
  en: { url: "Website address", view: "Open sample website", edit: "Edit content" },
  zh: { url: "网站地址", view: "打开示例网站", edit: "编辑网站内容" },
};

export function WebsiteDraftPreview({ locale, merchant }: { locale: Locale; merchant: Merchant }) {
  const { draft } = useMerchantDraft();
  const t = text[locale];
  const displayUrl = `merchantlaunchpad.com/${locale}/stores/${merchant.slug}`;
  return (
    <section className="website-preview-card">
      <div className="browser-bar"><span/><span/><span/><small>{displayUrl}</small></div>
      <div className="site-mini-preview" style={{ "--accent": merchant.accent, "--accent-soft": merchant.accentSoft } as React.CSSProperties}>
        {draft.images.storefront ? <img src={draft.images.storefront} alt="" /> : <span>{merchant.emoji}</span>}
        <div><small>{draft.category[locale]}</small><h2>{draft.name[locale]}</h2><p>{draft.address[locale]} · {draft.hours}</p></div>
      </div>
      <div className="website-actions"><div><small>{t.url}</small><strong>{displayUrl}</strong></div><Link className="secondary-button" href={`/${locale}/profile`}>{t.edit}</Link><Link className="primary-button" href={`/${locale}/stores/${merchant.slug}`}>{t.view}<Icon name="external" size={15}/></Link></div>
    </section>
  );
}
