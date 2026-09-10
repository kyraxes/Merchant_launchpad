"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Locale, Merchant } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";

type Format = "square" | "story" | "a4";
type Theme = "sunset" | "forest" | "night";
type QrTarget = "website" | "google" | "line" | "none";

const formats: Record<Format, { label: string; width: number; height: number }> = {
  square: { label: "Social · 1080×1080", width: 1080, height: 1080 },
  story: { label: "Story · 1080×1920", width: 1080, height: 1920 },
  a4: { label: "A4 · 1240×1754", width: 1240, height: 1754 },
};
const themes: Record<Theme, { from: string; to: string; ink: string }> = {
  sunset: { from: "#f65b37", to: "#ffbd59", ink: "#2c160f" },
  forest: { from: "#174f3b", to: "#85b55a", ink: "#f7fff5" },
  night: { from: "#1d2442", to: "#6554b8", ink: "#ffffff" },
};
const ui = {
  th: { kicker: "PRODUCT POSTER", title: "สร้างโปสเตอร์สินค้า", body: "เลือกสินค้า ภาษา และขนาด แล้วดาวน์โหลดภาพพร้อมแชร์", product: "สินค้า", language: "ภาษา", format: "ขนาด", theme: "สไตล์", qr: "QR code (ไม่บังคับ)", website: "เว็บไซต์ร้าน", google: "Google Maps", line: "LINE", none: "ไม่ใส่ QR", download: "ดาวน์โหลด PNG", preparing: "กำลังสร้าง…", scan: "สแกนดูข้อมูลร้าน", mock: "ตัวอย่างนี้ใช้ภาพจำลอง" },
  en: { kicker: "PRODUCT POSTER", title: "Create a product poster", body: "Choose a product, language and size, then download a ready-to-share image.", product: "Product", language: "Language", format: "Format", theme: "Style", qr: "QR code (optional)", website: "Store website", google: "Google Maps", line: "LINE", none: "No QR code", download: "Download PNG", preparing: "Preparing…", scan: "SCAN TO VIEW STORE", mock: "This demo uses placeholder artwork" },
  zh: { kicker: "PRODUCT POSTER", title: "生成商品海报", body: "选择商品、语言和尺寸，下载可直接分享的图片。", product: "商品", language: "语言", format: "尺寸", theme: "风格", qr: "二维码（可选）", website: "店铺网站", google: "Google Maps", line: "LINE", none: "不添加二维码", download: "下载PNG", preparing: "生成中…", scan: "扫码查看店铺", mock: "演示版使用占位商品图" },
};

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, min: number) {
  let size = start;
  while (size > min) { ctx.font = `800 ${size}px Arial, sans-serif`; if (ctx.measureText(text).width <= maxWidth) return size; size -= 4; }
  return min;
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

export function PosterStudio({ merchant, initialLocale }: { merchant: Merchant; initialLocale: Locale }) {
  const { draft } = useMerchantDraft();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const products = merchant.menu.flatMap((section) => section.items);
  const [productId, setProductId] = useState(products[0].id);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [format, setFormat] = useState<Format>("square");
  const [theme, setTheme] = useState<Theme>("sunset");
  const [qrTarget, setQrTarget] = useState<QrTarget>("website");
  const [ready, setReady] = useState(false);
  const product = useMemo(() => products.find((item) => item.id === productId) || products[0], [productId, products]);
  const t = ui[initialLocale];

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const canvas = canvasRef.current; if (!canvas) return;
      setReady(false);
      const spec = formats[format]; const palette = themes[theme]; const scale = spec.width / 1080;
      canvas.width = spec.width; canvas.height = spec.height;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const gradient = ctx.createLinearGradient(0, 0, spec.width, spec.height);
      gradient.addColorStop(0, palette.from); gradient.addColorStop(1, palette.to); ctx.fillStyle = gradient; ctx.fillRect(0, 0, spec.width, spec.height);
      ctx.globalAlpha = .13; ctx.fillStyle = "#fff";
      for (let i=0;i<7;i+=1) { ctx.beginPath(); ctx.arc(spec.width*(.08+i*.15), spec.height*(.08+(i%3)*.18), 85*scale, 0, Math.PI*2); ctx.fill(); }
      ctx.globalAlpha = 1;
      const pad = 76*scale; ctx.fillStyle = palette.ink; ctx.font = `700 ${28*scale}px Arial`; ctx.fillText(draft.name[locale].toUpperCase(), pad, pad);
      if (draft.images.product) {
        try {
          const itemImage = await loadCanvasImage(draft.images.product); if (cancelled) return;
          const imageSize = 220*scale; const imageY = pad+35*scale;
          ctx.save(); ctx.beginPath(); ctx.roundRect(pad, imageY, imageSize, imageSize, 28*scale); ctx.clip(); drawCover(ctx, itemImage, pad, imageY, imageSize, imageSize); ctx.restore();
        } catch { ctx.font = `900 ${190*scale}px Arial`; ctx.fillText(merchant.emoji, pad, pad+235*scale); }
      } else { ctx.font = `900 ${190*scale}px Arial`; ctx.fillText(merchant.emoji, pad, pad+235*scale); }
      const titleSize = fitText(ctx, product.name[locale], spec.width-pad*2, 92*scale, 44*scale); ctx.font = `800 ${titleSize}px Arial`; ctx.fillText(product.name[locale], pad, pad+365*scale);
      ctx.font = `500 ${34*scale}px Arial`; ctx.fillText(product.description[locale], pad, pad+420*scale);
      ctx.font = `900 ${74*scale}px Arial`; ctx.fillText(`฿${product.price}`, pad, pad+515*scale);
      const cardH = Math.min(300*scale, spec.height*.25); const cardY = spec.height-cardH-pad;
      ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.beginPath(); ctx.roundRect(pad, cardY, spec.width-pad*2, cardH, 28*scale); ctx.fill();
      ctx.fillStyle = "#171717"; ctx.font = `800 ${29*scale}px Arial`; ctx.fillText(qrTarget === "none" ? merchant.tagline[locale] : ui[locale].scan, pad+36*scale, cardY+65*scale);
      ctx.font = `500 ${24*scale}px Arial`; ctx.fillText(draft.address[locale], pad+36*scale, cardY+112*scale); ctx.fillText(draft.phone, pad+36*scale, cardY+153*scale);
      ctx.font = `600 ${18*scale}px Arial`; ctx.fillText("MOCK V1 · Merchant Launchpad", pad+36*scale, cardY+cardH-35*scale);
      if (qrTarget !== "none") {
        const origin = window.location.origin;
        const targets = { website: `${origin}/${locale}/stores/${merchant.slug}`, google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.name.en)}`, line: `https://line.me/R/ti/p/${draft.lineId}` };
        const qrData = await QRCode.toDataURL(targets[qrTarget], { margin: 1, width: 280 }); if (cancelled) return;
        const img = new Image(); img.onload = () => { if (cancelled) return; const size=Math.min(205*scale,cardH-60*scale); ctx.drawImage(img,spec.width-pad-size-32*scale,cardY+30*scale,size,size); setReady(true); }; img.src=qrData;
      } else setReady(true);
    }
    draw(); return () => { cancelled=true; };
  }, [draft, merchant, product, locale, format, theme, qrTarget]);

  function download() { const canvas=canvasRef.current; if(!canvas||!ready)return; const link=document.createElement("a"); link.download=`${merchant.slug}-${product.id}-${format}-${locale}.png`; link.href=canvas.toDataURL("image/png"); link.click(); }

  return <div className="poster-page">
    <section className="poster-controls">
      <div className="form-heading"><p className="eyebrow">{t.kicker}</p><h1>{t.title}</h1><p>{t.body}</p></div>
      <label>{t.product}<select value={productId} onChange={(e)=>setProductId(e.target.value)}>{products.map((item)=><option key={item.id} value={item.id}>{item.name[initialLocale]} · ฿{item.price}</option>)}</select></label>
      <div className="two-fields"><label>{t.language}<select value={locale} onChange={(e)=>setLocale(e.target.value as Locale)}><option value="th">ไทย</option><option value="en">English</option><option value="zh">中文</option></select></label><label>{t.format}<select value={format} onChange={(e)=>setFormat(e.target.value as Format)}>{Object.entries(formats).map(([key,val])=><option value={key} key={key}>{val.label}</option>)}</select></label></div>
      <fieldset><legend>{t.theme}</legend><div className="theme-row">{(Object.keys(themes) as Theme[]).map((item)=><button type="button" key={item} className={`theme-button ${theme===item?"active":""}`} onClick={()=>setTheme(item)}><span style={{background:`linear-gradient(135deg,${themes[item].from},${themes[item].to})`}}/>{item}</button>)}</div></fieldset>
      <label>{t.qr}<select value={qrTarget} onChange={(e)=>setQrTarget(e.target.value as QrTarget)}><option value="website">{t.website}</option><option value="google">{t.google}</option><option value="line">{t.line}</option><option value="none">{t.none}</option></select></label>
      <button className="save-button" type="button" onClick={download} disabled={!ready}><Icon name="poster" size={18}/>{ready?t.download:t.preparing}</button><small className="control-note">{t.mock}</small>
    </section>
    <section className="poster-preview" aria-label="Poster preview"><canvas ref={canvasRef}/></section>
  </div>;
}
