"use client";

import { useState } from "react";
import type { Locale } from "@/lib/types";
import { localizedValue } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";

const text = {
  th: { label: "ธุรกิจของฉัน", duplicate: "พบข้อมูลธุรกิจเก่าซ้ำ เลือกข้อมูลที่ต้องการเก็บและติดต่อผู้ดูแลเพื่อลบข้อมูลอื่น", sync: "ซิงค์", syncing: "กำลังซิงค์…", synced: "ซิงค์แล้ว", draft: "ฉบับร่าง", review: "รอตรวจ", published: "เผยแพร่แล้ว", rejected: "ไม่ผ่าน", requestError: "ซิงค์ไม่สำเร็จ กรุณาลองอีกครั้ง" },
  en: { label: "My business", duplicate: "Legacy duplicate profiles were found. Select the one to keep and ask an administrator to remove the others.", sync: "Sync", syncing: "Syncing…", synced: "Synced", draft: "Draft", review: "In review", published: "Published", rejected: "Rejected", requestError: "Sync failed. Please try again." },
  zh: { label: "我的商户", duplicate: "检测到历史重复资料。请选择需要保留的一条，并让管理员删除其他记录。", sync: "同步", syncing: "同步中…", synced: "已同步", draft: "草稿", review: "待审核", published: "已发布", rejected: "未通过", requestError: "同步失败，请重试" },
};

export function MerchantSwitcher({ locale }: { locale: Locale }) {
  const { draft, merchants, selectMerchant, syncServer, syncState } = useMerchantDraft();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = text[locale];

  if (!merchants.length) return null;

  return (
    <section className={`merchant-switcher ${merchants.length > 1 ? "has-legacy-duplicates" : ""}`}>
      {merchants.length > 1 ? <label><span>{t.label}</span><select value={draft.id} disabled={busy} onChange={(event) => { setBusy(true); void selectMerchant(event.target.value).finally(() => setBusy(false)); }}>{merchants.map((merchant) => <option value={merchant.id} key={merchant.id}>{localizedValue(merchant.name, locale)} · {t[merchant.status]}</option>)}</select><small className="legacy-duplicate-note">{t.duplicate}</small></label> : <div className="single-merchant-identity"><span>{t.label}</span><strong>{localizedValue(draft.name, locale)}</strong><small className={`workflow-status ${draft.status}`}>{t[draft.status]}</small></div>}
      <button className="sync-button" type="button" disabled={syncState === "syncing"} onClick={() => { setError(false); void syncServer().catch(() => setError(true)); }}>{syncState === "syncing" ? t.syncing : syncState === "synced" ? t.synced : t.sync}</button>
      {error && <small className="switcher-error">{t.requestError}</small>}
    </section>
  );
}
