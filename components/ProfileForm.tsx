"use client";

import { useState } from "react";
import type { Locale, Merchant } from "@/lib/types";
import { Icon } from "@/components/Icon";

const ui = {
  th: { title: "ข้อมูลร้าน", body: "กรอกครั้งเดียว เราจะนำข้อมูลไปใช้กับ Google เว็บไซต์ และโปสเตอร์", basic: "ข้อมูลพื้นฐาน", name: "ชื่อร้าน", category: "ประเภทร้าน", phone: "เบอร์โทร", line: "LINE ID", address: "ที่อยู่", hours: "เวลาเปิด", media: "รูปภาพและเมนู", storefront: "รูปหน้าร้าน", menu: "รูปเมนู", products: "รูปสินค้า", add: "เพิ่มรูป", save: "บันทึกข้อมูล", saved: "บันทึกแล้วในโหมดทดลอง", helper: "ระบบจริงจะอ่านชื่อและราคาจากรูปเมนู แล้วให้ร้านยืนยัน" },
  en: { title: "Store profile", body: "Enter it once. We reuse it for Google, your website and posters.", basic: "Basic information", name: "Store name", category: "Business category", phone: "Phone", line: "LINE ID", address: "Address", hours: "Opening hours", media: "Photos and menu", storefront: "Storefront photo", menu: "Menu photo", products: "Product photos", add: "Add photo", save: "Save store profile", saved: "Saved in demo mode", helper: "In the real flow, we read names and prices from your menu photo, then ask you to confirm." },
  zh: { title: "店铺资料", body: "只填写一次，Google、店铺网站和海报都会复用。", basic: "基础信息", name: "店铺名称", category: "店铺分类", phone: "联系电话", line: "LINE ID", address: "店铺地址", hours: "营业时间", media: "照片与菜单", storefront: "店招照片", menu: "菜单照片", products: "商品照片", add: "添加照片", save: "保存店铺资料", saved: "演示资料已保存", helper: "正式流程会从菜单照片识别菜名和价格，再请商家一次确认。" },
};

export function ProfileForm({ merchant, locale }: { merchant: Merchant; locale: Locale }) {
  const t = ui[locale];
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState({ storefront: true, menu: true, products: false });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="form-heading"><p className="eyebrow">MERCHANT PASSPORT</p><h1>{t.title}</h1><p>{t.body}</p></div>
      <section className="form-card">
        <div className="form-section-title"><span>1</span><h2>{t.basic}</h2></div>
        <div className="field-grid">
          <label>{t.name}<input defaultValue={merchant.name[locale]} /></label>
          <label>{t.category}<input defaultValue={merchant.category[locale]} /></label>
          <label>{t.phone}<input defaultValue={merchant.phone} /></label>
          <label>{t.line}<input defaultValue={merchant.lineId} /></label>
          <label className="full-field">{t.address}<textarea defaultValue={merchant.address[locale]} rows={2} /></label>
          <label className="full-field">{t.hours}<input defaultValue={`${merchant.openingHours[0].days[locale]} · ${merchant.openingHours[0].hours}`} /></label>
        </div>
      </section>
      <section className="form-card">
        <div className="form-section-title"><span>2</span><div><h2>{t.media}</h2><p>{t.helper}</p></div></div>
        <div className="upload-grid">
          {(["storefront", "menu", "products"] as const).map((kind) => (
            <button type="button" key={kind} className={`upload-box ${photos[kind] ? "has-photo" : ""}`} onClick={() => setPhotos((current) => ({ ...current, [kind]: true }))}>
              <span>{photos[kind] ? <Icon name="check" size={21}/> : <Icon name="camera" size={21}/>}</span>
              <strong>{t[kind]}</strong><small>{photos[kind] ? "1 photo" : t.add}</small>
            </button>
          ))}
        </div>
      </section>
      <button className="save-button" type="submit"><Icon name="check" size={18}/>{saved ? t.saved : t.save}</button>
    </form>
  );
}
