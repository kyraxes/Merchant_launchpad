"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";
import { localizedValue, profileCompletion } from "@/lib/merchant-draft";

const text = {
  th: { hello: "สวัสดี", title: "เริ่มให้ลูกค้าค้นพบร้านของคุณ", subtitle: "กรอกข้อมูลร้านเพียงครั้งเดียว แล้วใช้กับเครื่องมือทั้ง 3 อย่าง", complete: "ข้อมูลร้านพร้อมใช้งาน", improve: "แก้ไขข้อมูล" },
  en: { hello: "Hello", title: "Get your store ready to be found", subtitle: "Enter your store information once, then reuse it across all three tools.", complete: "Store profile ready", improve: "Edit profile" },
  zh: { hello: "你好", title: "让更多顾客找到你的店", subtitle: "店铺资料只填写一次，三个工具都可以直接使用。", complete: "店铺资料可用", improve: "编辑资料" },
};

export function MerchantWelcome({ locale }: { locale: Locale }) {
  const { draft } = useMerchantDraft();
  const t = text[locale];
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
