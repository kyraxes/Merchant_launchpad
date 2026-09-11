"use client";

import { useState } from "react";
import type { Locale } from "@/lib/types";
import { localizedValue } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";

const text = {
  th: { label: "ธุรกิจของฉัน", sync: "ซิงค์", syncing: "กำลังซิงค์…", synced: "ซิงค์แล้ว", draft: "ฉบับร่าง", review: "รอตรวจ", published: "เผยแพร่แล้ว", rejected: "ไม่ผ่าน", requestError: "ซิงค์ไม่สำเร็จ กรุณาลองอีกครั้ง" },
  en: { label: "My business", sync: "Sync", syncing: "Syncing…", synced: "Synced", draft: "Draft", review: "In review", published: "Published", rejected: "Rejected", requestError: "Sync failed. Please try again." },
  zh: { label: "我的商户", sync: "同步", syncing: "同步中…", synced: "已同步", draft: "草稿", review: "待审核", published: "已发布", rejected: "未通过", requestError: "同步失败，请重试" },
};

export function MerchantSwitcher({ locale }: { locale: Locale }) {
  const { draft, merchants, syncServer, syncState } = useMerchantDraft();
  const [error, setError] = useState(false);
  const t = text[locale];

  if (!merchants.length) return null;

  return (
    <section className="merchant-switcher">
      <div className="single-merchant-identity"><span>{t.label}</span><strong>{localizedValue(draft.name, locale)}</strong><small className={`workflow-status ${draft.status}`}>{t[draft.status]}</small></div>
      <button className="sync-button" type="button" disabled={syncState === "syncing"} onClick={() => { setError(false); void syncServer().catch(() => setError(true)); }}>{syncState === "syncing" ? t.syncing : syncState === "synced" ? t.synced : t.sync}</button>
      {error && <small className="switcher-error">{t.requestError}</small>}
    </section>
  );
}
