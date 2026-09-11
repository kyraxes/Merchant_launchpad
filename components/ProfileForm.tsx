"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import type { DraftImageKind, MerchantDraft } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { useLiff } from "@/components/LiffProvider";
import { Icon } from "@/components/Icon";
import { compressImage } from "@/lib/browser-image";

const ui = {
  th: { title: "แก้ไขข้อมูลธุรกิจ", body: "ข้อมูลที่ส่งแล้วเก็บบนเซิร์ฟเวอร์ การแก้ไขจะส่งเข้าตรวจสอบอีกครั้ง", empty: "ยังไม่มีธุรกิจบนเซิร์ฟเวอร์", create: "สร้างธุรกิจ", basic: "ข้อมูลพื้นฐาน", name: "ชื่อธุรกิจ", category: "ประเภทธุรกิจ", phone: "เบอร์โทร", line: "LINE (ไม่บังคับ)", address: "ที่อยู่", hours: "เวลาเปิด", media: "เปลี่ยนรูป (ไม่บังคับ)", storefront: "หน้าร้านหรือสถานที่", menu: "สินค้า บริการ หรือราคา", product: "สินค้าหรือผลงานเด่น", add: "เลือกรูปใหม่", submit: "บันทึกและส่งตรวจสอบ", submitting: "กำลังส่ง…", submitted: "บันทึกบนเซิร์ฟเวอร์และส่งตรวจสอบแล้ว", required: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ", lineRequired: "ต้องเปิดใน LINE", failed: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง", delete: "ลบข้อมูลนี้", deleteConfirm: "ลบข้อมูลนี้จากเซิร์ฟเวอร์หรือไม่?", deleteFailed: "ลบไม่ได้ ธุรกิจที่เผยแพร่แล้วต้องถอนก่อน", publishedWarning: "การแก้ไขธุรกิจที่เผยแพร่แล้วจะกลับเข้าสู่การตรวจสอบ" },
  en: { title: "Edit business information", body: "Submitted information is stored on the server. Changes are sent for review again.", empty: "No server business yet", create: "Create business", basic: "Basic information", name: "Business name", category: "Business category", phone: "Phone", line: "LINE (optional)", address: "Address", hours: "Opening hours", media: "Replace photos (optional)", storefront: "Storefront or workplace", menu: "Products, services or prices", product: "Featured product or work", add: "Choose a new photo", submit: "Save and submit for review", submitting: "Submitting…", submitted: "Saved on the server and submitted for review", required: "Complete all required information.", lineRequired: "Open inside LINE to continue.", failed: "Save failed. Please try again.", delete: "Delete this record", deleteConfirm: "Delete this record from the server?", deleteFailed: "Unable to delete. Published businesses must be withdrawn first.", publishedWarning: "Editing a published business sends it back to review." },
  zh: { title: "修改商户资料", body: "已提交资料只保存在服务器；修改后会重新进入审核。", empty: "服务器中还没有商户", create: "创建商户", basic: "基础信息", name: "商户名称", category: "商户分类", phone: "联系电话", line: "LINE联系方式（选填）", address: "经营地址", hours: "营业时间", media: "更换照片（选填）", storefront: "门店或经营场所", menu: "商品、服务或价目表", product: "代表性商品或案例", add: "选择新照片", submit: "保存并重新提交审核", submitting: "正在提交…", submitted: "已保存到服务器并提交审核", required: "请填写所有必填资料", lineRequired: "请在LINE内进行操作", failed: "保存失败，请重试", delete: "删除这条记录", deleteConfirm: "从服务器删除这条记录？", deleteFailed: "无法删除；已发布商户需要先在后台撤回", publishedWarning: "修改已发布商户后，网页会暂时回到审核状态。" },
};

const feedback = {
  th: { compressing: "กำลังเตรียมรูป…", ready: "เตรียมรูปแล้ว กดบันทึกเพื่ออัปโหลด", tooLarge: "รูปมีขนาดใหญ่เกินไป กรุณาเลือกรูปอื่น", forbidden: "เซสชันนี้ไม่สามารถส่งคำขอได้ กรุณาเปิดใหม่ใน LINE", missing: "ไม่พบข้อมูลธุรกิจนี้ กรุณาซิงค์อีกครั้ง" },
  en: { compressing: "Preparing photo…", ready: "Photo is ready. Tap save to upload it.", tooLarge: "The photo is too large. Choose a different image.", forbidden: "This session cannot submit changes. Reopen the app in LINE.", missing: "This business record was not found. Sync again." },
  zh: { compressing: "正在压缩照片…", ready: "照片已经准备好，点击保存后上传", tooLarge: "照片仍然过大，请换一张照片", forbidden: "当前会话不能提交修改，请从LINE重新打开", missing: "服务器找不到这条商户资料，请重新同步" },
};

export function ProfileForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const t = ui[locale];
  const { draft, merchants, hydrated, updateMerchant, deleteMerchant } = useMerchantDraft();
  const { idToken, isInClient, isLoggedIn } = useLiff();
  const [form, setForm] = useState<MerchantDraft>(draft);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const f = feedback[locale];

  useEffect(() => { setForm(draft); }, [draft]);

  function setLocalized(field: "name" | "category" | "address", value: string) {
    setForm((current) => ({ ...current, [field]: { ...current[field], [locale]: value } }));
  }

  async function selectImage(kind: DraftImageKind, file?: File) {
    if (!file) return;
    setImageBusy(true);
    setNotice(f.compressing);
    try {
      const compressed = await compressImage(file);
      setForm((current) => ({ ...current, images: { ...current.images, [kind]: compressed } }));
      setNotice(f.ready);
    } catch { setNotice(f.tooLarge); } finally { setImageBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!form.name[locale].trim() || !form.category[locale].trim() || !form.address[locale].trim() || !form.phone.trim() || !form.hours.trim()) {
      setNotice(t.required); return;
    }
    if (!isInClient || !isLoggedIn || !idToken) { setNotice(t.lineRequired); return; }
    setBusy(true);
    try {
      const updated = await updateMerchant(form, locale, idToken);
      setForm(updated);
      setNotice(t.submitted);
      navigator.vibrate?.(35);
    } catch (error) {
      const code = error instanceof Error ? error.message : "UPDATE_FAILED";
      setNotice(code === "INVALID_IMAGE" || code === "PAYLOAD_TOO_LARGE" ? f.tooLarge : code === "ORIGIN_NOT_ALLOWED" ? f.forbidden : code === "NOT_FOUND" ? f.missing : t.failed);
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm(t.deleteConfirm)) return;
    setBusy(true); setNotice("");
    try {
      await deleteMerchant(draft.id);
      router.push(`/${locale}`);
    } catch { setNotice(t.deleteFailed); } finally { setBusy(false); }
  }

  if (!hydrated) return <main className="profile-form"><p>{t.submitting}</p></main>;
  if (!merchants.length) return <section className="profile-empty"><span>🏪</span><h1>{t.empty}</h1><Link className="primary-button" href={`/${locale}/onboarding`}>{t.create}</Link></section>;

  return <form className="profile-form" onSubmit={submit}>
    <div className="form-heading"><p className="eyebrow">SERVER BUSINESS</p><h1>{t.title}</h1><p>{t.body}</p></div>
    {draft.status === "published" && <p className="honest-note">{t.publishedWarning}</p>}
    {notice && <p className="form-notice" role="status">{notice}</p>}
    <section className="form-card"><div className="form-section-title"><span>1</span><h2>{t.basic}</h2></div><div className="field-grid">
      <label>{t.name} *<input value={form.name[locale]} onChange={(event) => setLocalized("name", event.target.value)}/></label>
      <label>{t.category} *<input value={form.category[locale]} onChange={(event) => setLocalized("category", event.target.value)}/></label>
      <label>{t.phone} *<input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label>
      <label>{t.line}<input value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })}/></label>
      <label className="full-field">{t.address} *<textarea rows={2} value={form.address[locale]} onChange={(event) => setLocalized("address", event.target.value)}/></label>
      <label className="full-field">{t.hours} *<input value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })}/></label>
    </div></section>
    <section className="form-card"><div className="form-section-title"><span>2</span><h2>{t.media}</h2></div><div className="upload-grid">{(["storefront", "menu", "product"] as DraftImageKind[]).map((kind) => <label className={`upload-box ${form.images[kind] ? "has-photo" : ""}`} key={kind}>{form.images[kind] ? <img src={form.images[kind] || ""} alt=""/> : <span><Icon name="camera" size={21}/></span>}<strong>{t[kind]}</strong><small>{t.add}</small><input className="visually-hidden" type="file" accept="image/*" onChange={(event) => void selectImage(kind, event.target.files?.[0])}/></label>)}</div></section>
    <button className="save-button" type="submit" disabled={busy || imageBusy}>{busy ? t.submitting : imageBusy ? f.compressing : t.submit}</button>
    {draft.status !== "published" && <button className="reset-button danger-text" type="button" disabled={busy || imageBusy} onClick={() => void remove()}>{t.delete}</button>}
  </form>;
}
