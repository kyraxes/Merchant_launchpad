"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";
import { localizedValue, profileCompletion } from "@/lib/merchant-draft";

const text = {
  th: { hello: "สวัสดี", title: "เริ่มให้ลูกค้าค้นพบธุรกิจของคุณ", subtitle: "กรอกข้อมูลสั้น ๆ แล้วส่งตรวจสอบได้ทันที", complete: "ข้อมูลธุรกิจบนเซิร์ฟเวอร์", improve: "แก้ไขข้อมูล", empty: "ยังไม่มีธุรกิจ", emptyBody: "สร้างและส่งข้อมูลครั้งเดียว ไม่ต้องจัดการฉบับร่าง", create: "สร้างธุรกิจ" },
  en: { hello: "Hello", title: "Get your business ready to be found", subtitle: "Enter a few details and submit directly for review.", complete: "Server business profile", improve: "Edit profile", empty: "No business yet", emptyBody: "Create and submit in one short flow. There are no saved drafts to manage.", create: "Create business" },
  zh: { hello: "你好", title: "让更多顾客找到你的生意", subtitle: "填写少量资料后直接提交审核。", complete: "服务器商户资料", improve: "编辑资料", empty: "还没有商户", emptyBody: "一次填写并提交，不需要管理草稿。", create: "创建商户" },
};

export function MerchantWelcome({ locale }: { locale: Locale }) {
  const { draft, merchants } = useMerchantDraft();
  const t = text[locale];
  if (!merchants.length) return <section className="welcome-card empty-business-welcome"><div><p className="eyebrow">{t.hello}</p><h1>{t.title}</h1><p>{t.emptyBody}</p><Link className="primary-button" href={`/${locale}/onboarding`}>{t.create} <Icon name="arrow" size={16}/></Link></div><span>🏪</span></section>;
  const completion = profileCompletion(draft);
  return (
    <section className="welcome-card">
      <div><p className="eyebrow">{t.hello}，{localizedValue(draft.name, locale)}</p><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <div className="profile-progress-card">
        <div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` } as React.CSSProperties}><span>{completion}%</span></div>
        <div><strong>{t.complete}</strong><small>{localizedValue(draft.category, locale)} · {localizedValue(draft.address, locale)}</small></div>
        <Link href={`/${locale}/profile`}>{t.improve} <Icon name="arrow" size={16}/></Link>
      </div>
    </section>
  );
}
