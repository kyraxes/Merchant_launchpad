"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/types";
import { normalizeMerchantDraft, type DraftImageKind, type MerchantDraft } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";

const ui = {
  th: { title: "ข้อมูลร้าน", body: "กรอกครั้งเดียว เราจะนำข้อมูลไปใช้กับ Google เว็บไซต์ และโปสเตอร์", basic: "ข้อมูลพื้นฐาน", name: "ชื่อร้าน", category: "ประเภทร้าน", phone: "เบอร์โทร", line: "LINE สำหรับติดต่อ (ไม่บังคับ)", address: "ที่อยู่", hours: "เวลาเปิด", media: "รูปภาพและเมนู", storefront: "รูปหน้าร้าน", menu: "รูปเมนู", product: "รูปสินค้า", add: "ถ่ายหรือเลือกรูป", replace: "เปลี่ยนรูป", save: "บันทึกข้อมูล", saved: "บันทึกในเครื่องนี้แล้ว", helper: "รูปจะถูกย่อและเก็บในเบราว์เซอร์ของเครื่องนี้สำหรับการทดสอบ", import: "นำเข้าไฟล์ทดสอบ JSON", imported: "นำเข้าข้อมูลแล้ว กรุณาตรวจสอบและบันทึก", export: "ส่งออกข้อมูลที่บันทึก", reset: "รีเซ็ตข้อมูลทดลอง", invalid: "ไฟล์นี้ไม่ใช่ข้อมูลร้านที่รองรับ" },
  en: { title: "Store profile", body: "Enter it once. We reuse it for Google, your website and posters.", basic: "Basic information", name: "Store name", category: "Business category", phone: "Phone", line: "LINE contact (optional)", address: "Address", hours: "Opening hours", media: "Photos and menu", storefront: "Storefront photo", menu: "Menu photo", product: "Product photo", add: "Take or choose photo", replace: "Replace photo", save: "Save store profile", saved: "Saved on this device", helper: "Photos are compressed and stored in this browser for flow testing.", import: "Import test JSON", imported: "Data imported. Review and save it.", export: "Export saved data", reset: "Reset mock data", invalid: "This file is not supported merchant data" },
  zh: { title: "店铺资料", body: "只填写一次，Google、店铺网站和海报都会复用。", basic: "基础信息", name: "店铺名称", category: "店铺分类", phone: "联系电话", line: "LINE联系方式（选填）", address: "店铺地址", hours: "营业时间", media: "照片与菜单", storefront: "店招照片", menu: "菜单照片", product: "商品照片", add: "拍照或选择照片", replace: "更换照片", save: "保存店铺资料", saved: "已保存到当前设备", helper: "图片会压缩并保存在当前浏览器中，仅用于流程测试。", import: "导入测试JSON", imported: "数据已导入，请确认后保存", export: "导出已保存数据", reset: "重置Mock数据", invalid: "这不是可识别的商户数据文件" },
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unable to decode image"));
      image.onload = () => {
        const maxEdge = 1280;
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileForm({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const { draft, hydrated, saveDraft, resetDraft } = useMerchantDraft();
  const [form, setForm] = useState<MerchantDraft>(draft);
  const [notice, setNotice] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (hydrated) setForm(draft); }, [draft, hydrated]);

  function setLocalized(field: "name" | "category" | "address", value: string) {
    setForm((current) => ({ ...current, [field]: { ...current[field], [locale]: value } }));
  }

  async function selectImage(kind: DraftImageKind, file?: File) {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setForm((current) => ({ ...current, images: { ...current.images, [kind]: compressed } }));
      setNotice("");
    } catch {
      setNotice(t.invalid);
    }
  }

  async function importJson(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setForm(normalizeMerchantDraft(parsed, draft));
      setNotice(t.imported);
    } catch {
      setNotice(t.invalid);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "merchant-launchpad-export.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDraft(form);
    setNotice(t.saved);
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="form-heading"><p className="eyebrow">MERCHANT PASSPORT</p><h1>{t.title}</h1><p>{t.body}</p></div>
      <section className="test-data-toolbar">
        <div><strong>MOCK DATA</strong><p>{t.helper}</p></div>
        <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importJson(event.target.files?.[0])} />
        <button type="button" className="secondary-button" onClick={() => importRef.current?.click()}>{t.import}</button>
        <button type="button" className="secondary-button" onClick={exportJson}>{t.export}</button>
      </section>
      <div className="test-downloads">
        <a href="/test-data/mock-merchant.json" download>JSON</a>
        <a href="/test-data/mock-storefront.png" download>{t.storefront}</a>
        <a href="/test-data/mock-menu.png" download>{t.menu}</a>
        <a href="/test-data/mock-product.png" download>{t.product}</a>
      </div>
      {notice && <p className="form-notice" role="status">{notice}</p>}
      <section className="form-card">
        <div className="form-section-title"><span>1</span><h2>{t.basic}</h2></div>
        <div className="field-grid">
          <label>{t.name}<input value={form.name[locale]} onChange={(e) => setLocalized("name", e.target.value)} /></label>
          <label>{t.category}<input value={form.category[locale]} onChange={(e) => setLocalized("category", e.target.value)} /></label>
          <label>{t.phone}<input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>{t.line}<input value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })} /></label>
          <label className="full-field">{t.address}<textarea value={form.address[locale]} onChange={(e) => setLocalized("address", e.target.value)} rows={2} /></label>
          <label className="full-field">{t.hours}<input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></label>
        </div>
      </section>
      <section className="form-card">
        <div className="form-section-title"><span>2</span><div><h2>{t.media}</h2><p>{t.helper}</p></div></div>
        <div className="upload-grid">
          {(["storefront", "menu", "product"] as DraftImageKind[]).map((kind) => (
            <label key={kind} className={`upload-box ${form.images[kind] ? "has-photo" : ""}`}>
              {form.images[kind] ? <img src={form.images[kind] || ""} alt="" /> : <span><Icon name="camera" size={21}/></span>}
              <strong>{t[kind]}</strong><small>{form.images[kind] ? t.replace : t.add}</small>
              <input className="visually-hidden" type="file" accept="image/*" capture={kind === "storefront" ? "environment" : undefined} onChange={(event) => void selectImage(kind, event.target.files?.[0])} />
            </label>
          ))}
        </div>
      </section>
      <button className="save-button" type="submit"><Icon name="check" size={18}/>{t.save}</button>
      <button className="reset-button" type="button" onClick={() => { resetDraft(); setNotice(""); }}>{t.reset}</button>
    </form>
  );
}
