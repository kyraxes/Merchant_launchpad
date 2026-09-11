import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <main className="line-required-shell"><section className="line-required-card"><span>🔐</span><h1>审核后台登录</h1><p>此入口仅供 Merchant Launchpad 运营人员使用。</p><AdminLoginForm /></section></main>;
}
