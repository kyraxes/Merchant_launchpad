"use client";

import type { Locale } from "@/lib/types";
import { useLiff } from "@/components/LiffProvider";

const text = {
  th: {
    connecting: "กำลังเชื่อมต่อ LINE…",
    connected: "เชื่อมต่อกับ LINE แล้ว",
    hello: "ข้อมูล LINE พร้อมใช้งานสำหรับขั้นตอนถัดไป",
    preview: "โหมดตัวอย่างบนเบราว์เซอร์",
    previewBody: "เปิดลิงก์นี้ใน LINE เพื่อทดสอบประสบการณ์จริง",
    open: "เปิดใน LINE",
    fallback: "ไม่สามารถเชื่อมต่อ LINE ได้ แต่ยังดูตัวอย่างเว็บไซต์ได้",
  },
  en: {
    connecting: "Connecting to LINE…",
    connected: "Connected to LINE",
    hello: "Your LINE profile is ready for the next step.",
    preview: "Browser preview mode",
    previewBody: "Open this link in LINE to test the real in-app experience.",
    open: "Open in LINE",
    fallback: "LINE is unavailable, but the browser demo still works.",
  },
  zh: {
    connecting: "正在连接 LINE…",
    connected: "已连接 LINE",
    hello: "LINE 用户资料已就绪，可以用于后续建档流程。",
    preview: "普通浏览器预览模式",
    previewBody: "请在 LINE 中打开此入口，测试真实的小程序体验。",
    open: "在 LINE 中打开",
    fallback: "暂时无法连接 LINE，但仍可继续浏览演示。",
  },
};

export function LineStatusCard({ locale }: { locale: Locale }) {
  const { status, isInClient, isLoggedIn, profile, liffUrl } = useLiff();
  const t = text[locale];

  if (status === "loading") {
    return <section className="line-status-card loading"><span className="line-dot" /><p>{t.connecting}</p></section>;
  }

  if (status === "ready" && isInClient && isLoggedIn) {
    return (
      <section className="line-status-card connected">
        {profile?.pictureUrl ? <img src={profile.pictureUrl} alt="" referrerPolicy="no-referrer" /> : <span className="line-avatar">L</span>}
        <div><strong>{profile?.displayName || t.connected}</strong><p>{t.hello}</p></div>
        <span className="line-badge">LINE</span>
      </section>
    );
  }

  return (
    <section className="line-status-card preview">
      <span className="line-avatar">L</span>
      <div><strong>{status === "error" ? t.fallback : t.preview}</strong><p>{t.previewBody}</p></div>
      <a href={liffUrl}>{t.open}</a>
    </section>
  );
}
