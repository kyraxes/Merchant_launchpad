"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { createEmptyMerchantDraft, type DraftImageKind, type MerchantDraft } from "@/lib/merchant-draft";
import { compressImage } from "@/lib/browser-image";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { useLiff } from "@/components/LiffProvider";
import { Icon } from "@/components/Icon";

const text = {
  th: { title: "สร้างข้อมูลธุรกิจ", subtitle: "ธุรกิจจะถูกสร้างหลังกรอกข้อมูลขั้นต่ำและส่งตรวจเท่านั้น", photos: "รูปธุรกิจ", identity: "ชื่อและประเภทธุรกิจ", contact: "ที่ตั้งและการติดต่อ", confirm: "ตรวจสอบและส่ง", storefront: "หน้าร้านหรือสถานที่", menu: "สินค้า บริการ หรือราคา", product: "สินค้าหรือผลงานเด่น", add: "ถ่ายหรือเลือกรูป", name: "ชื่อธุรกิจ", category: "ประเภทธุรกิจ", address: "ที่อยู่", phone: "โทรศัพท์", hours: "เวลาเปิด", line: "LINE (ไม่บังคับ)", back: "ย้อนกลับ", next: "ไปต่อ", submit: "ส่งให้ตรวจสอบ", submitting: "กำลังส่ง…", error: "ส่งไม่สำเร็จ ยังไม่มีการสร้างธุรกิจ กรุณาลองอีกครั้ง", required: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ", ready: "ข้อมูลขั้นต่ำครบแล้ว", optional: "รูปนี้ไม่บังคับ", checking: "กำลังตรวจสอบตัวตน LINE…", lineTitle: "ต้องเปิดใน LINE", lineBody: "ต้องยืนยันตัวตนในแอป LINE ก่อนสร้างธุรกิจ เว็บเบราว์เซอร์ใช้ดูตัวอย่างได้เท่านั้น", openLine: "เปิดใน LINE", existingTitle: "คุณมีธุรกิจแล้ว", existingBody: "บัญชี LINE หนึ่งบัญชีจัดการหนึ่งธุรกิจเป็นค่าเริ่มต้น", manage: "จัดการธุรกิจของฉัน" },
  en: { title: "Create business profile", subtitle: "A business is created only after the minimum details are completed and submitted.", photos: "Business photos", identity: "Name and category", contact: "Location and contact", confirm: "Review and submit", storefront: "Storefront or workplace", menu: "Products, services or prices", product: "Featured product or work", add: "Take or choose photo", name: "Business name", category: "Business category", address: "Address", phone: "Phone", hours: "Opening hours", line: "LINE (optional)", back: "Back", next: "Continue", submit: "Submit for review", submitting: "Submitting…", error: "Submission failed. No business was created. Please try again.", required: "Complete all required fields before continuing.", ready: "Minimum details complete", optional: "This photo is optional", checking: "Verifying LINE identity…", lineTitle: "Open inside LINE", lineBody: "A verified LINE in-app session is required to create a business. Browsers are preview-only.", openLine: "Open in LINE", existingTitle: "You already have a business", existingBody: "Each LINE account manages one business by default.", manage: "Manage my business" },
  zh: { title: "创建商户资料", subtitle: "填完最低资料并提交审核后，才会真正创建商户。", photos: "商户照片", identity: "名称和分类", contact: "位置和联系方式", confirm: "确认并提交", storefront: "门店或经营场所", menu: "商品、服务或价目表", product: "代表性商品或案例", add: "拍照或选择照片", name: "商户名称", category: "商户分类", address: "经营地址", phone: "联系电话", hours: "营业时间", line: "LINE（选填）", back: "上一步", next: "下一步", submit: "提交审核", submitting: "正在提交…", error: "提交失败，商户尚未创建，请重试", required: "请先填写所有必填资料", ready: "最低资料已经填完", optional: "这张照片可以稍后补充", checking: "正在验证LINE身份…", lineTitle: "请在LINE内打开", lineBody: "创建商户必须先通过LINE客户端身份验证；普通浏览器只能预览。", openLine: "在LINE中打开", existingTitle: "你已经有一家商户", existingBody: "每个LINE账号默认管理一家商户。请返回修改现有资料。", manage: "管理我的商户" },
};

const categoryOptions = {
  th: ["ร้านอาหาร", "ร้านกาแฟ", "ร้านเสื้อผ้า", "ร้านค้าปลีก", "ร้านเสริมสวย", "บริการซ่อม", "บริการในท้องถิ่น"],
  en: ["Restaurant", "Cafe", "Clothing store", "Retail shop", "Beauty salon", "Repair service", "Local service"],
  zh: ["餐厅", "咖啡店", "服装店", "零售店", "美容店", "维修服务", "本地服务"],
};

export function OnboardingWizard({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { hydrated, merchants, submitMerchant } = useMerchantDraft();
  const { status, isInClient, isLoggedIn, idToken, liffUrl } = useLiff();
  const [form, setForm] = useState<MerchantDraft | null>(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = text[locale];
  const steps = [t.photos, t.identity, t.contact, t.confirm];
  const hasLineIdentity = status === "ready" && isInClient && isLoggedIn && Boolean(idToken);

  useEffect(() => {
    if (hydrated && !form) setForm(createEmptyMerchantDraft(`pending-${crypto.randomUUID()}`, locale));
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
    if (!form || !idToken) return;
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
      await submitMerchant(form, locale, idToken);
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

  if (merchants.length) {
    return <main className="line-required-shell"><section className="line-required-card"><span>✓</span><h1>{t.existingTitle}</h1><p>{t.existingBody}</p><Link className="primary-button" href={`/${locale}/profile`}>{t.manage}</Link></section></main>;
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header"><button type="button" onClick={() => step > 1 ? setStep(step - 1) : router.push(`/${locale}`)}>←</button><div><p className="eyebrow">NEW BUSINESS</p><h1>{t.title}</h1><p>{t.subtitle}</p></div></header>
      <ol className="wizard-progress">{steps.map((label, index) => <li key={label} className={index + 1 === step ? "active" : index + 1 < step ? "complete" : ""}><span>{index + 1 < step ? "✓" : index + 1}</span><small>{label}</small></li>)}</ol>
      <section className="wizard-card">
        <div className="wizard-title"><span>{step}</span><div><p className="eyebrow">STEP {step} / 4</p><h2>{steps[step - 1]}</h2></div></div>
        {step === 1 && <div className="wizard-upload-grid">{(["storefront", "menu", "product"] as DraftImageKind[]).map((kind) => <label key={kind} className={form.images[kind] ? "filled" : ""}>{form.images[kind] ? <img src={form.images[kind] || ""} alt="" /> : <Icon name="camera" size={25}/>}<strong>{t[kind]}</strong><small>{kind === "product" ? t.optional : t.add}</small><input className="visually-hidden" type="file" accept="image/*" capture={kind === "storefront" ? "environment" : undefined} onChange={(event) => void chooseImage(kind, event.target.files?.[0])}/></label>)}</div>}
        {step === 2 && <div className="field-grid wizard-fields"><label>{t.name} *<input autoFocus value={form.name[locale]} onChange={(event) => localized("name", event.target.value)}/></label><label>{t.category} *<input list={`business-categories-${locale}`} value={form.category[locale]} onChange={(event) => localized("category", event.target.value)}/><datalist id={`business-categories-${locale}`}>{categoryOptions[locale].map((option) => <option value={option} key={option}/>)}</datalist></label></div>}
        {step === 3 && <div className="field-grid wizard-fields"><label className="full-field">{t.address} *<textarea rows={3} value={form.address[locale]} onChange={(event) => localized("address", event.target.value)}/></label><label>{t.phone} *<input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label><label>{t.hours} *<input value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })}/></label><label className="full-field">{t.line}<input value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })}/></label></div>}
        {step === 4 && <div className="wizard-review"><div className="review-store">{form.images.storefront ? <img src={form.images.storefront} alt=""/> : <span>{form.emoji}</span>}<div><small>{form.category[locale]}</small><h3>{form.name[locale]}</h3><p>{form.address[locale]}</p></div></div><dl><div><dt>{t.phone}</dt><dd>{form.phone}</dd></div><div><dt>{t.hours}</dt><dd>{form.hours}</dd></div><div><dt>{t.menu}</dt><dd>{form.images.menu ? "✓" : "—"}</dd></div></dl><p className="review-ready"><Icon name="check" size={18}/>{t.ready}</p></div>}
        {error && <p className="wizard-error" role="alert">{error}</p>}
        <div className="wizard-actions">{step > 1 && <button className="secondary-button" type="button" disabled={busy} onClick={() => { setError(""); setStep(step - 1); }}>{t.back}</button>}<button className="primary-button" type="button" disabled={busy} onClick={() => void continueFlow()}>{busy ? t.submitting : step === 4 ? t.submit : t.next}<Icon name="arrow" size={17}/></button></div>
      </section>
    </main>
  );
}
