"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
export function LaunchAccess() {
  const [url, setUrl] = useState(""); const [qr, setQr] = useState("");
  useEffect(() => { const address = `${window.location.origin}/th`; setUrl(address); void QRCode.toDataURL(address, { width: 520 }).then(setQr).catch(() => undefined); }, []);
  return <main className="launch-access"><section className="launch-copy"><p className="eyebrow">WEBSITE</p><h1>在手机或电脑打开网站</h1><p>无需 LINE，使用浏览器注册、管理商户和发布菜单。</p><a className="primary-button" href={url}>打开网站</a><p><a href={url}>{url}</a></p></section><section className="launch-qr-card">{qr && <img src={qr} alt="网站二维码"/>}<strong>扫描后在浏览器打开</strong></section></main>;
}
