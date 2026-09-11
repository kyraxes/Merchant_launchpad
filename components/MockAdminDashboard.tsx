"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileCompletion, type MerchantWorkflowStatus } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { ServerSubmissionQueue } from "@/components/ServerSubmissionQueue";

const statusLabel = { draft: "草稿", review: "等待审核", published: "已发布" };
const eventLabel = { created: "创建店铺", saved: "保存资料", submitted: "提交审核", published: "发布网站", unpublished: "撤回发布", selected: "切换店铺" };

export function MockAdminDashboard() {
  const router = useRouter();
  const { merchants, events, draft, hydrated, failNextRequest, setFailNextRequest, selectMerchant, setMerchantStatus, deleteMerchant } = useMerchantDraft();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function run(id: string, action: () => Promise<void>, success: string) {
    setBusy(id); setMessage("");
    try { await action(); setMessage(success); } catch { setMessage("模拟请求失败：界面和已有数据保持不变"); } finally { setBusy(""); }
  }

  async function changeStatus(id: string, status: MerchantWorkflowStatus) {
    await run(id, () => setMerchantStatus(id, status), `状态已更新为“${statusLabel[status]}”`);
  }

  if (!hydrated) return <main className="admin-shell"><p>正在加载 Mock 数据…</p></main>;
  return (
    <main className="admin-shell">
      <header className="admin-heading"><div><p className="eyebrow">MERCHANT OPERATIONS</p><h1>商户管理台</h1><p>服务器审核队列用于真实 LINE 提交；下方设备数据仅用于 Mock 测试。</p></div><div><button className="secondary-button" type="button" onClick={() => router.push("/zh")}>返回商户端</button></div></header>
      <ServerSubmissionQueue />
      <div className="local-mock-heading"><p className="eyebrow">DEVICE MOCK</p><h2>当前设备测试数据</h2></div>
      <section className="admin-stats"><article><strong>{merchants.length}</strong><span>全部商户</span></article><article><strong>{merchants.filter((item) => item.status === "review").length}</strong><span>等待审核</span></article><article><strong>{merchants.filter((item) => item.status === "published").length}</strong><span>已发布</span></article><article><strong>{events.length}</strong><span>操作事件</span></article></section>
      <section className="mock-control-card"><div><strong>异常场景测试</strong><p>开启后，下一次保存、切换或状态修改会等待约 0.4 秒后失败。</p></div><label><input type="checkbox" checked={failNextRequest} onChange={(event) => setFailNextRequest(event.target.checked)}/><span>{failNextRequest ? "下一次请求将失败" : "下一次请求正常"}</span></label></section>
      {message && <p className="admin-message" role="status">{message}</p>}
      <section className="admin-section"><div className="section-title"><h2>商户列表</h2><span>{merchants.length}</span></div><div className="admin-merchant-list">{merchants.map((merchant) => <article key={merchant.id} className={merchant.id === draft.id ? "active" : ""}><div className="admin-merchant-art">{merchant.images.storefront ? <img src={merchant.images.storefront} alt=""/> : merchant.emoji}</div><div className="admin-merchant-copy"><div><h3>{merchant.name.zh || merchant.name.th || merchant.name.en || "未命名店铺"}</h3><span className={`workflow-status ${merchant.status}`}>{statusLabel[merchant.status]}</span></div><p>{merchant.category.zh || merchant.category.th || merchant.category.en} · {merchant.address.zh || merchant.address.th || merchant.address.en || "尚未填写地址"}</p><div className="admin-progress"><span style={{ width: `${profileCompletion(merchant)}%` }}/></div><small>资料完整度 {profileCompletion(merchant)}%</small></div><div className="admin-row-actions"><button type="button" disabled={busy === merchant.id} onClick={() => void run(merchant.id, () => selectMerchant(merchant.id), "已切换当前店铺")}>设为当前</button>{merchant.status !== "review" && <button type="button" disabled={busy === merchant.id} onClick={() => void changeStatus(merchant.id, "review")}>提交审核</button>}{merchant.status !== "published" && <button type="button" disabled={busy === merchant.id} onClick={() => void changeStatus(merchant.id, "published")}>发布</button>}{merchant.status === "published" && <button type="button" disabled={busy === merchant.id} onClick={() => void changeStatus(merchant.id, "draft")}>撤回</button>}<button className="danger" type="button" disabled={busy === merchant.id || merchants.length <= 1} onClick={() => { if (window.confirm("仅删除当前设备中的这条 Mock 商户数据？")) void run(merchant.id, () => deleteMerchant(merchant.id), "Mock 商户已删除"); }}>删除</button></div></article>)}</div></section>
      <section className="admin-section"><div className="section-title"><h2>最近事件</h2><span>{events.length}</span></div><div className="event-list">{events.length ? events.slice(0, 12).map((event) => { const merchant = merchants.find((item) => item.id === event.merchantId); return <article key={event.id}><span>{eventLabel[event.type]}</span><strong>{merchant?.name.zh || merchant?.name.th || merchant?.name.en || "已删除商户"}</strong><time>{new Date(event.at).toLocaleString("zh-CN")}</time></article>; }) : <p>完成保存、切换或发布后，这里会出现事件。</p>}</div></section>
    </main>
  );
}
