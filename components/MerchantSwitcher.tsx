"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { localizedValue } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { useLiff } from "@/components/LiffProvider";

const text = {
  th: { label: "ร้านที่กำลังใช้งาน", add: "เพิ่มร้าน", checking: "กำลังตรวจ LINE…", admin: "จัดการข้อมูล", draft: "ฉบับร่าง", review: "รอตรวจ", published: "เผยแพร่แล้ว", lineRequired: "ต้องเปิดใน LINE และยืนยันตัวตนก่อนสร้างร้าน", openLine: "เปิดใน LINE", requestError: "เปลี่ยนร้านไม่สำเร็จ กรุณาลองอีกครั้ง" },
  en: { label: "Active store", add: "Add store", checking: "Checking LINE…", admin: "Mock admin", draft: "Draft", review: "In review", published: "Published", lineRequired: "Open this app inside LINE and verify your identity before creating a store.", openLine: "Open in LINE", requestError: "Store switch failed. Please try again." },
  zh: { label: "当前店铺", add: "创建店铺", checking: "正在验证LINE…", admin: "Mock管理后台", draft: "草稿", review: "待审核", published: "已发布", lineRequired: "创建店铺需要在LINE内打开并完成身份验证。", openLine: "在LINE中打开", requestError: "切换店铺失败，请重试" },
};

export function MerchantSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { draft, merchants, selectMerchant } = useMerchantDraft();
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
      <label><span>{t.label}</span><select value={draft.id} disabled={busy} onChange={(event) => void select(event.target.value)}>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{localizedValue(merchant.name, locale)} · {t[merchant.status]}</option>)}</select></label>
      <button type="button" onClick={create} disabled={busy || status === "loading"}>{status === "loading" ? t.checking : `＋ ${t.add}`}</button>
      <Link href="/admin">{t.admin}</Link>
      {error && <small className="switcher-error">{error === "line" ? <>{t.lineRequired} <a href={liffUrl}>{t.openLine}</a></> : t.requestError}</small>}
    </section>
  );
}
