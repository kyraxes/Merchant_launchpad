"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import type { DraftImageKind, MerchantDraft } from "@/lib/merchant-draft";
import { compressImage } from "@/lib/browser-image";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";

const text = {
  th: { title: "สร้างข้อมูลร้าน", subtitle: "4 ขั้นตอน ข้อมูลจะบันทึกอัตโนมัติเมื่อไปต่อ", photos: "ถ่ายรูปร้าน", identity: "ชื่อและประเภทร้าน", contact: "ที่ตั้งและการติดต่อ", confirm: "ตรวจสอบและส่ง", storefront: "หน้าร้าน", menu: "เมนู", product: "สินค้า", add: "ถ่ายหรือเลือกรูป", name: "ชื่อร้าน", category: "ประเภทร้าน", address: "ที่อยู่", phone: "โทรศัพท์", hours: "เวลาเปิด", line: "LINE (ไม่บังคับ)", back: "ย้อนกลับ", next: "บันทึกและไปต่อ", submit: "ส่งให้ตรวจสอบ", saving: "กำลังบันทึก…", error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง", ready: "ข้อมูลพร้อมส่ง", optional: "รูปสินค้าไม่บังคับ" },
  en: { title: "Create store profile", subtitle: "Four short steps. Progress saves whenever you continue.", photos: "Store photos", identity: "Name and category", contact: "Location and contact", confirm: "Review and submit", storefront: "Storefront", menu: "Menu", product: "Product", add: "Take or choose photo", name: "Store name", category: "Business category", address: "Address", phone: "Phone", hours: "Opening hours", line: "LINE (optional)", back: "Back", next: "Save and continue", submit: "Submit for review", saving: "Saving…", error: "Save failed. Please try again.", ready: "Ready for review", optional: "Product photo is optional" },
  zh: { title: "创建店铺资料", subtitle: "只需四步，每次继续时自动保存。", photos: "拍摄店铺", identity: "店名和分类", contact: "位置和联系方式", confirm: "确认并提交", storefront: "店招照片", menu: "菜单照片", product: "商品照片", add: "拍照或选择照片", name: "店铺名称", category: "店铺分类", address: "店铺地址", phone: "联系电话", hours: "营业时间", line: "LINE（选填）", back: "上一步", next: "保存并继续", submit: "提交审核", saving: "正在保存…", error: "保存失败，请重试", ready: "资料可以提交", optional: "商品照片可以稍后补充" },
};

export function OnboardingWizard({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { draft, hydrated, saveDraft, setMerchantStatus } = useMerchantDraft();
  const [form, setForm] = useState<MerchantDraft>(draft);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = text[locale];
  const steps = [t.photos, t.identity, t.contact, t.confirm];

  useEffect(() => { if (hydrated) setForm(draft); }, [draft, hydrated]);

  function localized(field: "name" | "category" | "address", value: string) {
    setForm((current) => ({ ...current, [field]: { ...current[field], [locale]: value } }));
  }

  async function chooseImage(kind: DraftImageKind, file?: File) {
    if (!file) return;
    try {
      const image = await compressImage(file);
      setForm((current) => ({ ...current, images: { ...current.images, [kind]: image } }));
    } catch { setError(t.error); }
  }

  async function continueFlow() {
    setBusy(true); setError("");
    try {
      await saveDraft(form);
      if (step < 4) setStep((current) => current + 1);
      else {
        await setMerchantStatus(form.id, "review");
        navigator.vibrate?.(35);
        router.push(`/${locale}`);
      }
    } catch { setError(t.error); } finally { setBusy(false); }
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header"><button type="button" onClick={() => step > 1 ? setStep(step - 1) : router.push(`/${locale}`)}>←</button><div><p className="eyebrow">NEW MERCHANT</p><h1>{t.title}</h1><p>{t.subtitle}</p></div></header>
      <ol className="wizard-progress">{steps.map((label, index) => <li key={label} className={index + 1 === step ? "active" : index + 1 < step ? "complete" : ""}><span>{index + 1 < step ? "✓" : index + 1}</span><small>{label}</small></li>)}</ol>
      <section className="wizard-card">
        <div className="wizard-title"><span>{step}</span><div><p className="eyebrow">STEP {step} / 4</p><h2>{steps[step - 1]}</h2></div></div>
        {step === 1 && <><div className="wizard-upload-grid">{(["storefront", "menu", "product"] as DraftImageKind[]).map((kind) => <label key={kind} className={form.images[kind] ? "filled" : ""}>{form.images[kind] ? <img src={form.images[kind] || ""} alt="" /> : <Icon name="camera" size={25}/>}<strong>{t[kind]}</strong><small>{kind === "product" ? t.optional : t.add}</small><input className="visually-hidden" type="file" accept="image/*" capture={kind === "storefront" ? "environment" : undefined} onChange={(event) => void chooseImage(kind, event.target.files?.[0])}/></label>)}</div></>}
        {step === 2 && <div className="field-grid wizard-fields"><label>{t.name}<input autoFocus value={form.name[locale]} onChange={(e) => localized("name", e.target.value)}/></label><label>{t.category}<input value={form.category[locale]} onChange={(e) => localized("category", e.target.value)}/></label></div>}
        {step === 3 && <div className="field-grid wizard-fields"><label className="full-field">{t.address}<textarea rows={3} value={form.address[locale]} onChange={(e) => localized("address", e.target.value)}/></label><label>{t.phone}<input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label><label>{t.hours}<input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}/></label><label className="full-field">{t.line}<input value={form.lineId} onChange={(e) => setForm({ ...form, lineId: e.target.value })}/></label></div>}
        {step === 4 && <div className="wizard-review"><div className="review-store">{form.images.storefront ? <img src={form.images.storefront} alt=""/> : <span>{form.emoji}</span>}<div><small>{form.category[locale]}</small><h3>{form.name[locale]}</h3><p>{form.address[locale]}</p></div></div><dl><div><dt>{t.phone}</dt><dd>{form.phone || "—"}</dd></div><div><dt>{t.hours}</dt><dd>{form.hours || "—"}</dd></div><div><dt>{t.menu}</dt><dd>{form.images.menu ? "✓" : "—"}</dd></div></dl><p className="review-ready"><Icon name="check" size={18}/>{t.ready}</p></div>}
        {error && <p className="wizard-error" role="alert">{error}</p>}
        <div className="wizard-actions">{step > 1 && <button className="secondary-button" type="button" onClick={() => setStep(step - 1)}>{t.back}</button>}<button className="primary-button" type="button" disabled={busy} onClick={() => void continueFlow()}>{busy ? t.saving : step === 4 ? t.submit : t.next}<Icon name="arrow" size={17}/></button></div>
      </section>
    </main>
  );
}
