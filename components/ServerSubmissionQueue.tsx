"use client";

import { useEffect, useState } from "react";
import type { MerchantSubmission, SubmissionStatus } from "@/lib/submissions";

const statusLabel: Record<SubmissionStatus, string> = { review: "等待审核", approved: "已通过", rejected: "已驳回" };

function apiMessage(code: string) {
  if (code === "ADMIN_NOT_CONFIGURED") return "服务器尚未设置 ADMIN_API_KEY。请先在 Netlify 环境变量中添加。";
  if (code === "ADMIN_UNAUTHORIZED") return "管理密钥不正确。";
  return "无法读取服务器审核队列，请稍后重试。";
}

export function ServerSubmissionQueue() {
  const [adminKey, setAdminKey] = useState("");
  const [submissions, setSubmissions] = useState<MerchantSubmission[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [storage, setStorage] = useState<"memory" | "netlify-blobs" | "">("");
  const published = submissions.filter((item) => item.status === "approved");

  useEffect(() => { setAdminKey(window.sessionStorage.getItem("merchant-admin-key") || ""); }, []);

  async function load(key = adminKey) {
    if (!key) { setMessage("请输入管理密钥。"); return; }
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/submissions", { headers: { "x-admin-key": key }, cache: "no-store" });
      const payload = await response.json() as { submissions?: MerchantSubmission[]; storage?: "memory" | "netlify-blobs"; error?: string };
      if (!response.ok || !payload.submissions) throw new Error(payload.error || "ADMIN_ERROR");
      window.sessionStorage.setItem("merchant-admin-key", key);
      setSubmissions(payload.submissions);
      setStorage(payload.storage || "");
      setConnected(true);
    } catch (error) {
      setConnected(false);
      setMessage(apiMessage(error instanceof Error ? error.message : "ADMIN_ERROR"));
    } finally { setLoading(false); }
  }

  async function changeStatus(id: string, status: SubmissionStatus) {
    setBusyId(id); setMessage("");
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json() as { submission?: MerchantSubmission; error?: string };
      if (!response.ok || !payload.submission) throw new Error(payload.error || "ADMIN_ERROR");
      setSubmissions((current) => current.map((item) => item.id === id ? payload.submission as MerchantSubmission : item));
      setMessage(`“${payload.submission.name}”已更新为${statusLabel[status]}。`);
    } catch (error) {
      setMessage(apiMessage(error instanceof Error ? error.message : "ADMIN_ERROR"));
    } finally { setBusyId(""); }
  }

  return (
    <section className="server-queue admin-section">
      <div className="section-title"><div><p className="eyebrow">SERVER DATA</p><h2>真实审核与发布</h2>{connected && <small className={`storage-status ${storage}`}>{storage === "netlify-blobs" ? "● 持久化服务器数据" : "⚠ 临时内存数据"}</small>}</div>{connected && <button type="button" onClick={() => void load()} disabled={loading}>刷新</button>}</div>
      {!connected && <form className="admin-key-form" onSubmit={(event) => { event.preventDefault(); void load(); }}><label>管理密钥<input type="password" autoComplete="current-password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} placeholder="ADMIN_API_KEY"/></label><button className="primary-button" type="submit" disabled={loading}>{loading ? "正在连接…" : "连接审核队列"}</button></form>}
      {message && <p className="admin-message" role="status">{message}</p>}
      {connected && <>
        <div className="server-stats"><span><strong>{submissions.length}</strong>全部申请</span><span><strong>{submissions.filter((item) => item.status === "review").length}</strong>等待审核</span><span><strong>{submissions.filter((item) => item.status === "approved").length}</strong>已通过</span></div>
        <div className="server-submission-list">{submissions.length ? submissions.map((submission) => <article key={submission.id}><div><div className="submission-heading"><h3>{submission.name}</h3><span className={`workflow-status ${submission.status === "approved" ? "published" : submission.status}`}>{statusLabel[submission.status]}</span></div><p>{submission.category} · {submission.address}</p><small>{submission.phone} · {submission.hours} · LINE用户：{submission.ownerDisplayName} · 图片 {Object.values(submission.imageKeys).filter(Boolean).length} 张</small></div><div className="admin-row-actions">{submission.status === "approved" && <a href={`/${submission.locale}/stores/${submission.id}`} target="_blank" rel="noreferrer">查看公开网页</a>}<button type="button" disabled={busyId === submission.id} onClick={() => void changeStatus(submission.id, "approved")}>通过并发布</button><button type="button" disabled={busyId === submission.id} onClick={() => void changeStatus(submission.id, "rejected")}>驳回</button>{submission.status !== "review" && <button type="button" disabled={busyId === submission.id} onClick={() => void changeStatus(submission.id, "review")}>重新审核</button>}</div></article>) : <p className="server-empty">还没有来自 LINE 的商户申请。</p>}</div>
        <div className="published-server-list"><div className="section-title"><div><p className="eyebrow">PUBLIC DIRECTORY</p><h3>已发布商户列表</h3></div><a href="/zh/stores" target="_blank" rel="noreferrer">打开全部商户</a></div>{published.length ? <div>{published.map((item) => <a href={`/${item.locale}/stores/${item.id}`} target="_blank" rel="noreferrer" key={item.id}><span>🏪</span><div><strong>{item.name}</strong><small>{item.category} · {item.address}</small></div></a>)}</div> : <p className="server-empty">审核通过的商户会自动出现在这里，并生成公开网页。</p>}</div>
      </>}
      <p className="server-note">管理密钥只保存在当前标签页。服务器未配置密钥时，审核数据不会对浏览器开放。</p>
    </section>
  );
}
