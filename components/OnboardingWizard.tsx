"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { createEmptyMerchantDraft, type DraftImageKind, type MerchantDraft } from "@/lib/merchant-draft";
import { compressImage } from "@/lib/browser-image";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { useLiff } from "@/components/LiffProvider";
import { Icon } from "@/components/Icon";

const text = {
  th: { title: "สร้างข้อมูลร้าน", subtitle: "ร้านจะถูกสร้างหลังกรอกข้อมูลขั้นต่ำและส่งตรวจเท่านั้น", photos: "ถ่ายรูปร้าน", identity: "ชื่อและประเภทร้าน", contact: "ที่ตั้งและการติดต่อ", confirm: "ตรวจสอบและส่ง", storefront: "หน้าร้าน", menu: "เมนู", product: "สินค้า", add: "ถ่ายหรือเลือกรูป", name: "ชื่อร้าน", category: "ประเภทร้าน", address: "ที่อยู่", phone: "โทรศัพท์", hours: "เวลาเปิด", line: "LINE (ไม่บังคับ)", back: "ย้อนกลับ", next: "ไปต่อ", submit: "ส่งให้ตรวจสอบ", submitting: "กำลังส่ง…", error: "ส่งไม่สำเร็จ ยังไม่มีการสร้างร้าน กรุณาลองอีกครั้ง", required: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ", ready: "ข้อมูลขั้นต่ำครบแล้ว", optional: "รูปสินค้าไม่บังคับ", checking: "กำลังตรวจสอบตัวตน LINE…", lineTitle: "ต้องเปิดใน LINE", lineBody: "ต้องยืนยันตัวตนในแอป LINE ก่อนสร้างร้าน เว็บเบราว์เซอร์ใช้ดูตัวอย่างได้เท่านั้น", openLine: "เปิดใน LINE" },
  en: { title: "Create store profile", subtitle: "A store is created only after the minimum details are completed and submitted.", photos: "Store photos", identity: "Name and category", contact: "Location and contact", confirm: "Review and submit", storefront: "Storefront", menu: "Menu", product: "Product", add: "Take or choose photo", name: "Store name", category: "Business category", address: "Address", phone: "Phone", hours: "Opening hours", line: "LINE (optional)", back: "Back", next: "Continue", submit: "Submit for review", submitting: "Submitting…", error: "Submission failed. No store was created. Please try again.", required: "Complete all required fields before continuing.", ready: "Minimum details complete", optional: "Product photo is optional", checking: "Verifying LINE identity…", lineTitle: "Open inside LINE", lineBody: "A verified LINE in-app session is required to create a store. Browsers are preview-only.", openLine: "Open in LINE" },
  zh: { title: "创建店铺资料", subtitle: "填完最低资料并提交审核后，才会真正创建店铺。", photos: "拍摄店铺", identity: "店名和分类", contact: "位置和联系方式", confirm: "确认并提交", storefront: "店招照片", menu: "菜单照片", product: "商品照片", add: "拍照或选择照片", name: "店铺名称", category: "店铺分类", address: "店铺地址", phone: "联系电话", hours: "营业时间", line: "LINE（选填）", back: "上一步", next: "下一步", submit: "提交审核", submitting: "正在提交…", error: "提交失败，店铺尚未创建，请重试", required: "请先填写所有必填资料", ready: "最低资料已经填完", optional: "商品照片可以稍后补充", checking: "正在验证LINE身份…", lineTitle: "请在LINE内打开", lineBody: "创建店铺必须先通过LINE客户端身份验证；普通浏览器只能预览。", openLine: "在LINE中打开" },
};

export function OnboardingWizard({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { hydrated, submitMerchant } = useMerchantDraft();
  const { status, isInClient, isLoggedIn, liffUrl } = useLiff();
  const [form, setForm] = useState<MerchantDraft | null>(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = text[locale];
  const steps = [t.photos, t.identity, t.contact, t.confirm];
  const hasLineIdentity = status === "ready" && isInClient && isLoggedIn;

  useEffect(() => {
    if (hydrated && !form) setForm(createEmptyMerchantDraft("pending", locale));
  }, [form, hydrated, locale]);

  function localized(field: "name" | "category" | "address", value: string) {
    setForm((current) => current ? { ...current, [field]: { ...current[field], [locale]: value } } : current);
  }

  async function chooseImage(kind: DraftImageKind, file?: File) {
    if (!file) return;
    try {
      const image = await compressImage(file);
      setForm((current) => current ? { ...current, images: { ...current.images, [kind]: image } } : current);
      setError("");
    } catch { setError(t.error); }
  }

  function stepIsComplete(currentStep: number) {
    if (!form) return false;
    if (currentStep === 2) return Boolean(form.name[locale].trim() && form.category[locale].trim());
    if (currentStep === 3 || currentStep === 4) return Boolean(
      form.name[locale].trim()
      && form.category[locale].trim()
      && form.address[locale].trim()
      && form.phone.trim()
      && form.hours.trim()
    );
    return true;
  }

  async function continueFlow() {
    if (!form) return;
    setError("");
    if (!stepIsComplete(step)) {
      setError(t.required);
      return;
    }
    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }
    setBusy(true);
    try {
      await submitMerchant(form);
      navigator.vibrate?.(35);
      router.push(`/${locale}`);
    } catch { setError(t.error); } finally { setBusy(false); }
  }

  if (status === "loading" || !hydrated || !form) {
    return <main className="line-required-shell"><section className="line-required-card"><span>L</span><h1>{t.checking}</h1></section></main>;
  }

  if (!hasLineIdentity) {
    return <main className="line-required-shell"><section className="line-required-card"><span>L</span><h1>{t.lineTitle}</h1><p>{t.lineBody}</p><a className="primary-button" href={liffUrl}>{t.openLine}</a></section></main>;
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header"><button type="button" onClick={() => step > 1 ? setStep(step - 1) : router.push(`/${locale}`)}>←</button><div><p className="eyebrow">NEW MERCHANT</p><h1>{t.title}</h1><p>{t.subtitle}</p></div></header>
      <ol className="wizard-progress">{steps.map((label, index) => <li key={label} className={index + 1 === step ? "active" : index + 1 < step ? "complete" : ""}><span>{index + 1 < step ? "✓" : index + 1}</span><small>{label}</small></li>)}</ol>
      <section className="wizard-card">
        <div className="wizard-title"><span>{step}</span><div><p className="eyebrow">STEP {step} / 4</p><h2>{steps[step - 1]}</h2></div></div>
        {step === 1 && <div className="wizard-upload-grid">{(["storefront", "menu", "product"] as DraftImageKind[]).map((kind) => <label key={kind} className={form.images[kind] ? "filled" : ""}>{form.images[kind] ? <img src={form.images[kind] || ""} alt="" /> : <Icon name="camera" size={25}/>}<strong>{t[kind]}</strong><small>{kind === "product" ? t.optional : t.add}</small><input className="visually-hidden" type="file" accept="image/*" capture={kind === "storefront" ? "environment" : undefined} onChange={(event) => void chooseImage(kind, event.target.files?.[0])}/></label>)}</div>}
        {step === 2 && <div className="field-grid wizard-fields"><label>{t.name} *<input autoFocus value={form.name[locale]} onChange={(event) => localized("name", event.target.value)}/></label><label>{t.category} *<input value={form.category[locale]} onChange={(event) => localized("category", event.target.value)}/></label></div>}
        {step === 3 && <div className="field-grid wizard-fields"><label className="full-field">{t.address} *<textarea rows={3} value={form.address[locale]} onChange={(event) => localized("address", event.target.value)}/></label><label>{t.phone} *<input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label><label>{t.hours} *<input value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })}/></label><label className="full-field">{t.line}<input value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })}/></label></div>}
        {step === 4 && <div className="wizard-review"><div className="review-store">{form.images.storefront ? <img src={form.images.storefront} alt=""/> : <span>{form.emoji}</span>}<div><small>{form.category[locale]}</small><h3>{form.name[locale]}</h3><p>{form.address[locale]}</p></div></div><dl><div><dt>{t.phone}</dt><dd>{form.phone}</dd></div><div><dt>{t.hours}</dt><dd>{form.hours}</dd></div><div><dt>{t.menu}</dt><dd>{form.images.menu ? "✓" : "—"}</dd></div></dl><p className="review-ready"><Icon name="check" size={18}/>{t.ready}</p></div>}
        {error && <p className="wizard-error" role="alert">{error}</p>}
        <div className="wizard-actions">{step > 1 && <button className="secondary-button" type="button" disabled={busy} onClick={() => { setError(""); setStep(step - 1); }}>{t.back}</button>}<button className="primary-button" type="button" disabled={busy} onClick={() => void continueFlow()}>{busy ? t.submitting : step === 4 ? t.submit : t.next}<Icon name="arrow" size={17}/></button></div>
      </section>
    </main>
  );
}
