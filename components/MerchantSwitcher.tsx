"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { localizedValue } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { useLiff } from "@/components/LiffProvider";

const text = {
  th: { label: "ธุรกิจที่กำลังใช้งาน", empty: "ยังไม่มีธุรกิจ", add: "เพิ่มธุรกิจ", checking: "กำลังตรวจ LINE…", admin: "จัดการข้อมูล", sync: "ซิงค์", syncing: "กำลังซิงค์…", synced: "ซิงค์แล้ว", draft: "ฉบับร่าง", review: "รอตรวจ", published: "เผยแพร่แล้ว", rejected: "ไม่ผ่าน", lineRequired: "ต้องเปิดใน LINE และยืนยันตัวตนก่อนสร้างธุรกิจ", openLine: "เปิดใน LINE", requestError: "ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง" },
  en: { label: "Active business", empty: "No business yet", add: "Add business", checking: "Checking LINE…", admin: "Admin", sync: "Sync", syncing: "Syncing…", synced: "Synced", draft: "Draft", review: "In review", published: "Published", rejected: "Rejected", lineRequired: "Open this app inside LINE and verify your identity before creating a business.", openLine: "Open in LINE", requestError: "Request failed. Please try again." },
  zh: { label: "当前商户", empty: "还没有商户", add: "创建商户", checking: "正在验证LINE…", admin: "管理后台", sync: "同步", syncing: "同步中…", synced: "已同步", draft: "草稿", review: "待审核", published: "已发布", rejected: "未通过", lineRequired: "创建商户需要在LINE内打开并完成身份验证。", openLine: "在LINE中打开", requestError: "操作失败，请重试" },
};

export function MerchantSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { draft, merchants, selectMerchant, syncServer, syncState } = useMerchantDraft();
  const { status, isInClient, isLoggedIn, idToken, liffUrl } = useLiff();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"line" | "request" | null>(null);
  const t = text[locale];

  function create() {
    setError(null);
    if (status !== "ready" || !isInClient || !isLoggedIn || !idToken) {
      setError("line");
      return;
    }
    router.push(`/${locale}/onboarding`);
  }

  async function select(id: string) {
    setBusy(true); setError(null);
    try { await selectMerchant(id); } catch { setError("request"); } finally { setBusy(false); }
  }

  return (
    <section className="merchant-switcher">
      <label><span>{t.label}</span><select value={merchants.length ? draft.id : ""} disabled={busy || !merchants.length} onChange={(event) => void select(event.target.value)}>{!merchants.length && <option value="">{t.empty}</option>}{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{localizedValue(merchant.name, locale)} · {t[merchant.status]}</option>)}</select></label>
      <button className="sync-button" type="button" disabled={syncState === "syncing" || !idToken} onClick={() => void syncServer().catch(() => setError("request"))}>{syncState === "syncing" ? t.syncing : syncState === "synced" ? t.synced : t.sync}</button>
      <button type="button" onClick={create} disabled={busy || status === "loading"}>{status === "loading" ? t.checking : `＋ ${t.add}`}</button>
      <Link href="/admin">{t.admin}</Link>
      {error && <small className="switcher-error">{error === "line" ? <>{t.lineRequired} <a href={liffUrl}>{t.openLine}</a></> : t.requestError}</small>}
    </section>
  );
}
