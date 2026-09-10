"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { liffUrl } from "@/lib/line";

export function LaunchAccess() {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { void QRCode.toDataURL(liffUrl, { margin: 2, width: 520 }).then(setQr); }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(liffUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="launch-access">
      <section className="launch-copy">
        <p className="eyebrow">LINE ENTRY</p>
        <h1>在手机 LINE 中打开</h1>
        <p>当前是 LIFF App，不会出现在 LINE 的“小程序搜索”里。电脑端扫描二维码即可测试；正式主动入口应放在 LINE Official Account 的欢迎消息或 Rich Menu 中。</p>
        <div className="launch-actions">
          <a className="primary-button" href={liffUrl}>打开 LIFF</a>
          <button className="secondary-button" type="button" onClick={() => void copyLink()}>{copied ? "已复制" : "复制链接"}</button>
          <Link className="secondary-button" href="/th">浏览器预览</Link>
        </div>
        <code>{liffUrl}</code>
      </section>
      <section className="launch-qr-card">
        {qr ? <img src={qr} alt="Merchant Launchpad LIFF QR code" /> : <span>Generating QR…</span>}
        <strong>用 LINE 扫描</strong>
        <small>Merchant Launchpad · LIFF V1</small>
      </section>
    </main>
  );
}
