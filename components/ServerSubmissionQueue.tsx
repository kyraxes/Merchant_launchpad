"use client";

import { useCallback, useEffect, useState } from "react";
import type { MerchantSubmission, SubmissionStatus } from "@/lib/submissions";

const statusLabel: Record<SubmissionStatus, string> = { review: "等待审核", approved: "已通过", rejected: "已驳回" };

function apiMessage(code: string) {
  if (code === "ADMIN_NOT_CONFIGURED") return "服务器尚未设置 ADMIN_API_KEY。请先在 Netlify 环境变量中添加。";
  if (code === "ORIGIN_NOT_ALLOWED") return "请求来源不受信任。";
  return "无法读取服务器审核队列，请重新登录。";
}

export function ServerSubmissionQueue() {
  const [submissions, setSubmissions] = useState<MerchantSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [storage, setStorage] = useState<"memory" | "netlify-blobs" | "">("");
  const published = submissions.filter((item) => item.status === "approved");
  const ownerCounts = submissions.reduce<Record<string, number>>((counts, item) => {
    counts[item.ownerLineUserId] = (counts[item.ownerLineUserId] || 0) + 1;
    return counts;
  }, {});

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/submissions", { cache: "no-store" });
      const payload = await response.json() as { submissions?: MerchantSubmission[]; storage?: "memory" | "netlify-blobs"; error?: string };
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      if (!response.ok || !payload.submissions) throw new Error(payload.error || "ADMIN_ERROR");
      setSubmissions(payload.submissions);
      setStorage(payload.storage || "");
    } catch (error) {
      setMessage(apiMessage(error instanceof Error ? error.message : "ADMIN_ERROR"));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(id: string, status: SubmissionStatus) {
    setBusyId(id); setMessage("");
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json() as { submission?: MerchantSubmission; error?: string };
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      if (!response.ok || !payload.submission) throw new Error(payload.error || "ADMIN_ERROR");
      setSubmissions((current) => current.map((item) => item.id === id ? payload.submission as MerchantSubmission : item));
      setMessage(`“${payload.submission.name}”已更新为${statusLabel[status]}。`);
    } catch (error) {
      setMessage(apiMessage(error instanceof Error ? error.message : "ADMIN_ERROR"));
    } finally { setBusyId(""); }
  }

  async function linkAccount(submission: MerchantSubmission) {
    const username = window.prompt("请输入店主已注册的网站用户名。请先核实身份；该旧 LINE 账号下的全部历史商户将关联到此网站账号。");
    if (!username) return;
    if (!window.confirm(`确认将“${submission.ownerDisplayName}”的旧商户资料绑定给网站账号“${username}”？`)) return;
    setBusyId(submission.id); setMessage("");
    try {
      const response = await fetch("/api/admin/accounts/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, merchantId: submission.id }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setMessage("绑定成功。请店主重新登录网站，原商户和菜单会保留。");
    } catch (error) { setMessage(`绑定失败：${error instanceof Error ? error.message : "请重试"}。目标账号必须已注册且尚未创建商户。`); }
    finally { setBusyId(""); }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.assign("/admin/login");
  }

  async function remove(submission: MerchantSubmission) {
    if (!window.confirm(`永久删除“${submission.name}”及其图片？此操作用于清理历史重复记录，无法撤销。`)) return;
    setBusyId(submission.id); setMessage("");
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}`, { method: "DELETE" });
      if (response.status === 401) { window.location.assign("/admin/login"); return; }
      if (!response.ok) {
        const payload = await response.json() as { error?: string };
        throw new Error(payload.error || "ADMIN_ERROR");
      }
      setSubmissions((current) => current.filter((item) => item.id !== submission.id));
      setMessage(`“${submission.name}”及其图片已从服务器删除。`);
    } catch (error) {
      setMessage(apiMessage(error instanceof Error ? error.message : "ADMIN_ERROR"));
    } finally { setBusyId(""); }
  }

  return (
    <section className="server-queue admin-section">
      <div className="section-title"><div><p className="eyebrow">SERVER DATA</p><h2>真实审核与发布</h2>{storage && <small className={`storage-status ${storage}`}>{storage === "netlify-blobs" ? "● 持久化服务器数据" : "⚠ 临时内存数据"}</small>}</div><div className="admin-session-actions"><button type="button" onClick={() => void load()} disabled={loading}>{loading ? "加载中…" : "刷新"}</button><button type="button" onClick={() => void logout()}>退出后台</button></div></div>
      {message && <p className="admin-message" role="status">{message}</p>}
      {!loading && <>
        <div className="server-stats"><span><strong>{submissions.length}</strong>全部申请</span><span><strong>{submissions.filter((item) => item.status === "review").length}</strong>等待审核</span><span><strong>{submissions.filter((item) => item.status === "approved").length}</strong>已通过</span></div>
        <div className="server-submission-list">{submissions.length ? submissions.map((submission) => <article key={submission.id}><div><div className="submission-heading"><h3>{submission.name}</h3><span className={`workflow-status ${submission.status === "approved" ? "published" : submission.status}`}>{statusLabel[submission.status]}</span>{ownerCounts[submission.ownerLineUserId] > 1 && <span className="duplicate-record-badge">同账号 {ownerCounts[submission.ownerLineUserId]} 条</span>}</div><p>{submission.category} · {submission.address}</p><small>{submission.phone} · {submission.hours} · 所有者：{submission.ownerDisplayName} · 图片 {Object.values(submission.imageKeys).filter(Boolean).length} 张 · {new Date(submission.submittedAt).toLocaleString("zh-CN")}</small></div><div className="admin-row-actions">{!submission.ownerLineUserId.startsWith("web-") && <button type="button" disabled={busyId === submission.id} onClick={() => void linkAccount(submission)}>绑定网站账号</button>}{submission.status === "approved" && <a href={`/${submission.locale}/stores/${submission.id}`} target="_blank" rel="noreferrer">查看公开网页</a>}<button type="button" disabled={busyId === submission.id} onClick={() => void changeStatus(submission.id, "approved")}>通过并发布</button><button type="button" disabled={busyId === submission.id} onClick={() => void changeStatus(submission.id, "rejected")}>驳回</button>{submission.status !== "review" && <button type="button" disabled={busyId === submission.id} onClick={() => void changeStatus(submission.id, "review")}>重新审核</button>}<button className="danger" type="button" disabled={busyId === submission.id} onClick={() => void remove(submission)}>永久删除</button></div></article>) : <p className="server-empty">还没有商户申请。</p>}</div>
        <div className="published-server-list"><div className="section-title"><div><p className="eyebrow">PUBLIC DIRECTORY</p><h3>已发布商户列表</h3></div><a href="/zh/stores" target="_blank" rel="noreferrer">打开全部商户</a></div>{published.length ? <div>{published.map((item) => <a href={`/${item.locale}/stores/${item.id}`} target="_blank" rel="noreferrer" key={item.id}><span>🏪</span><div><strong>{item.name}</strong><small>{item.category} · {item.address}</small></div></a>)}</div> : <p className="server-empty">审核通过的商户会自动出现在这里，并生成公开网页。</p>}</div>
      </>}
      <p className="server-note">管理员会话使用 HttpOnly、SameSite Cookie，有效期 8 小时；密钥不会保存在网页存储中。</p>
    </section>
  );
}
