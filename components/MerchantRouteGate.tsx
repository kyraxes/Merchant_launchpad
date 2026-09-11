"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";
import { useLiff } from "@/components/LiffProvider";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";

const text = {
  th: { checking: "กำลังตรวจสอบสิทธิ์…", lineTitle: "ต้องเปิดใน LINE", lineBody: "หน้านี้ใช้ได้เฉพาะเจ้าของธุรกิจที่ยืนยันตัวตนผ่าน LINE", open: "เปิดใน LINE", emptyTitle: "ยังไม่มีข้อมูลธุรกิจ", emptyBody: "สร้างข้อมูลธุรกิจก่อนใช้เครื่องมือ", create: "เริ่มสร้างข้อมูล", failedTitle: "โหลดข้อมูลไม่สำเร็จ", failedBody: "เราไม่สามารถยืนยันข้อมูลธุรกิจจากเซิร์ฟเวอร์ได้", retry: "ลองอีกครั้ง" },
  en: { checking: "Checking access…", lineTitle: "Open inside LINE", lineBody: "This page is available only to business owners verified through LINE.", open: "Open in LINE", emptyTitle: "No business profile yet", emptyBody: "Create your business profile before using this tool.", create: "Create profile", failedTitle: "Unable to load business", failedBody: "We could not verify your business data with the server.", retry: "Try again" },
  zh: { checking: "正在验证访问权限…", lineTitle: "请在 LINE 内打开", lineBody: "该页面只允许通过 LINE 身份验证的商户本人访问。", open: "在 LINE 中打开", emptyTitle: "还没有商户资料", emptyBody: "请先完成首次商户建档，再使用这些工具。", create: "开始填写资料", failedTitle: "无法加载商户资料", failedBody: "当前无法从服务器确认你的商户身份。", retry: "重新同步" },
};

export function MerchantRouteGate({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const { status, isInClient, isLoggedIn, idToken, liffUrl } = useLiff();
  const { hydrated, merchants, syncState, syncServer } = useMerchantDraft();
  const t = text[locale];

  if (status === "loading" || !hydrated) return <main className="line-required-shell"><section className="line-required-card"><span>L</span><h1>{t.checking}</h1></section></main>;
  if (status !== "ready" || !isInClient || !isLoggedIn || !idToken) return <main className="line-required-shell"><section className="line-required-card"><span>🔒</span><h1>{t.lineTitle}</h1><p>{t.lineBody}</p><a className="primary-button" href={liffUrl}>{t.open}</a></section></main>;
  if (syncState === "error") return <main className="line-required-shell"><section className="line-required-card"><span>!</span><h1>{t.failedTitle}</h1><p>{t.failedBody}</p><button className="primary-button" type="button" onClick={() => void syncServer().catch(() => undefined)}>{t.retry}</button></section></main>;
  if (!merchants.length) return <main className="line-required-shell"><section className="line-required-card"><span>🏪</span><h1>{t.emptyTitle}</h1><p>{t.emptyBody}</p><Link className="primary-button" href={`/${locale}/onboarding`}>{t.create}</Link></section></main>;
  return children;
}
