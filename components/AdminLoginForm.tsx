"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adminKey: key }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(payload.error === "ADMIN_NOT_CONFIGURED" ? "服务器尚未配置管理员密钥。" : "管理员密钥不正确。");
        return;
      }
      setKey("");
      router.replace("/admin");
      router.refresh();
    } catch {
      setMessage("登录失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-key-form" onSubmit={submit}>
    <label>管理员密钥<input type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} /></label>
    <button className="primary-button" type="submit" disabled={busy || !key}>{busy ? "正在验证…" : "进入审核后台"}</button>
    {message && <p className="admin-message" role="alert">{message}</p>}
  </form>;
}
