"use client";

import { useRouter } from "next/navigation";
import { ServerSubmissionQueue } from "@/components/ServerSubmissionQueue";

export function MerchantAdminDashboard() {
  const router = useRouter();

  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">MERCHANT OPERATIONS</p>
          <h1>商户管理台</h1>
          <p>这里仅显示服务器数据库中的商户申请、审核状态和已发布商户。</p>
        </div>
        <div>
          <button className="secondary-button" type="button" onClick={() => router.push("/zh")}>返回商户端</button>
        </div>
      </header>
      <ServerSubmissionQueue />
    </main>
  );
}
