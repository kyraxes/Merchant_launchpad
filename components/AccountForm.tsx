"use client";
import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
export const accountCopy = {
  zh: { login: "登录", register: "注册网站账号", username: "用户名", password: "密码", hint: "用户名使用 3–40 位字母、数字、下划线或短横线；密码 12–128 位。", help: "无需 LINE。请妥善保存密码，当前尚未提供自助找回。旧 LINE 商户请注册后联系管理员绑定，不要重复建店。", busy: "正在处理…", error: "操作失败，请重试。", invalid: "请检查用户名格式和密码长度。", exists: "该用户名已注册，请换一个或登录。", credentials: "用户名或密码不正确。", limit: "尝试过于频繁，请 15 分钟后重试。", home: "返回首页", logged: "已登录", logout: "退出登录", retry: "重新连接", intro: "使用网站账号管理店铺与线上菜单。" },
  en: { login: "Sign in", register: "Create website account", username: "Username", password: "Password", hint: "Username: 3–40 letters, numbers, underscores or hyphens. Password: 12–128 characters.", help: "No LINE required. Keep your password safe; self-service recovery is not available yet. For an existing LINE business, ask an administrator to link your account before creating another business.", busy: "Working…", error: "Unable to complete. Try again.", invalid: "Check the username format and password length.", exists: "Username taken. Choose another or sign in.", credentials: "Incorrect username or password.", limit: "Too many attempts. Try again in 15 minutes.", home: "Back home", logged: "Signed in", logout: "Sign out", retry: "Reconnect", intro: "Manage your business and online menu with a website account." },
  th: { login: "เข้าสู่ระบบ", register: "สมัครบัญชีเว็บไซต์", username: "ชื่อผู้ใช้", password: "รหัสผ่าน", hint: "ชื่อผู้ใช้ 3–40 ตัวอักษรอังกฤษ ตัวเลข _ หรือ - รหัสผ่าน 12–128 ตัวอักษร", help: "ไม่ต้องใช้ LINE กรุณาเก็บรหัสผ่านไว้ ยังไม่มีระบบกู้คืนด้วยตนเอง หากมีร้านเดิมใน LINE ให้ติดต่อผู้ดูแลเพื่อเชื่อมบัญชีก่อนสร้างร้านใหม่", busy: "กำลังดำเนินการ…", error: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่", invalid: "ตรวจสอบรูปแบบชื่อผู้ใช้และความยาวรหัสผ่าน", exists: "ชื่อผู้ใช้นี้มีแล้ว กรุณาเลือกชื่อใหม่หรือเข้าสู่ระบบ", credentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", limit: "ลองบ่อยเกินไป กรุณารอ 15 นาที", home: "กลับหน้าแรก", logged: "เข้าสู่ระบบแล้ว", logout: "ออกจากระบบ", retry: "เชื่อมต่อใหม่", intro: "จัดการร้านและเมนูออนไลน์ด้วยบัญชีเว็บไซต์" },
};
export function AccountForm({ locale }: { locale: Locale }) {
  const t = accountCopy[locale];
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      const response = await fetch("/api/account/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: register ? "register" : "login", username: fields.get("username"), password: fields.get("password") }), signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // Reload providers so a previous user's business can never remain selected.
      window.location.assign(`/${locale}/menu`);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      setError(code === "INVALID_ACCOUNT" ? t.invalid : code === "ACCOUNT_EXISTS" ? t.exists : code === "INVALID_CREDENTIALS" ? t.credentials : code === "RATE_LIMITED" ? t.limit : t.error);
      setBusy(false);
    }
  }
  return <main className="app-main form-main"><Link href={`/${locale}`}>← {t.home}</Link><form className="form-card account-form" onSubmit={submit}><h1>{register ? t.register : t.login}</h1><p>{t.intro}</p><label>{t.username}<input required name="username" autoComplete="username" autoCapitalize="none" pattern="[a-zA-Z0-9_-]{3,40}" minLength={3} maxLength={40}/></label><label>{t.password}<input required name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={12} maxLength={128}/></label><p>{t.hint}</p>{error && <p role="alert" className="menu-error">{error}</p>}<button disabled={busy} className="primary-button">{busy ? t.busy : register ? t.register : t.login}</button><button disabled={busy} className="secondary-button" type="button" onClick={() => { setRegister(!register); setError(""); }}>{register ? t.login : t.register}</button><p>{t.help}</p></form></main>;
}
