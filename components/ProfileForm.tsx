"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { normalizeMerchantDraft, type DraftImageKind, type MerchantDraft } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";
import { compressImage } from "@/lib/browser-image";
import { useLiff } from "@/components/LiffProvider";

const ui = {
  th: { title: "ข้อมูลธุรกิจ", body: "กรอกครั้งเดียว เราจะนำข้อมูลไปใช้กับ Google เว็บไซต์ และโปสเตอร์", basic: "ข้อมูลพื้นฐาน", name: "ชื่อธุรกิจ", category: "ประเภทธุรกิจ", phone: "เบอร์โทร", line: "LINE สำหรับติดต่อ (ไม่บังคับ)", address: "ที่อยู่", hours: "เวลาเปิด", media: "รูปธุรกิจและสินค้า", storefront: "หน้าร้านหรือสถานที่", menu: "สินค้า บริการ หรือราคา", product: "สินค้าหรือผลงานเด่น", add: "ถ่ายหรือเลือกรูป", replace: "เปลี่ยนรูป", save: "บันทึกในเครื่อง", saving: "กำลังบันทึก…", saved: "บันทึกในเครื่องนี้แล้ว", saveError: "บันทึกไม่สำเร็จ กรุณาลองลดจำนวนรูป", helper: "รูปจะถูกย่อและเก็บในเบราว์เซอร์ของเครื่องนี้สำหรับการทดสอบ", import: "นำเข้าไฟล์ทดสอบ JSON", imported: "นำเข้าข้อมูลแล้ว กรุณาตรวจสอบและบันทึก", export: "ส่งออกข้อมูลที่บันทึก", exportTitle: "ข้อมูลธุรกิจ JSON", exportBody: "ไฟล์นี้ไม่รวมรูปภาพ รูปยังเก็บอยู่ในอุปกรณ์นี้", copy: "คัดลอก JSON", copied: "คัดลอกแล้ว", share: "แชร์", download: "ดาวน์โหลดในเบราว์เซอร์", close: "ปิด", reset: "รีเซ็ตข้อมูลทดลอง", invalid: "ไฟล์นี้ไม่ใช่ข้อมูลธุรกิจที่รองรับ", submitReview: "ส่งไปยังเซิร์ฟเวอร์เพื่อตรวจสอบ", submittingReview: "กำลังส่งไปยังเซิร์ฟเวอร์…", submittedReview: "ส่งไปยังเซิร์ฟเวอร์แล้ว", required: "กรุณากรอกชื่อ ประเภท ที่อยู่ โทรศัพท์ และเวลาเปิด", lineRequired: "ต้องเปิดใน LINE เพื่อส่งข้อมูล", deleteDraft: "ลบข้อมูลนี้", deleteConfirm: "ลบข้อมูลนี้ออกจากอุปกรณ์และเซิร์ฟเวอร์หรือไม่?", deleteError: "ลบไม่ได้ ธุรกิจที่เผยแพร่แล้วต้องถอนก่อน" },
  en: { title: "Business profile", body: "Enter it once. We reuse it for Google, your website and posters.", basic: "Basic information", name: "Business name", category: "Business category", phone: "Phone", line: "LINE contact (optional)", address: "Address", hours: "Opening hours", media: "Business and offering photos", storefront: "Storefront or workplace", menu: "Products, services or prices", product: "Featured product or work", add: "Take or choose photo", replace: "Replace photo", save: "Save on this device", saving: "Saving…", saved: "Saved on this device", saveError: "Save failed. Try using fewer photos.", helper: "Photos are compressed and stored in this browser for flow testing.", import: "Import test JSON", imported: "Data imported. Review and save it.", export: "Export saved data", exportTitle: "Business data JSON", exportBody: "This export excludes photos. They remain stored on this device.", copy: "Copy JSON", copied: "Copied", share: "Share", download: "Browser download", close: "Close", reset: "Reset mock data", invalid: "This file is not supported business data", submitReview: "Submit to server for review", submittingReview: "Submitting to server…", submittedReview: "Submitted to the server", required: "Complete name, category, address, phone and opening hours.", lineRequired: "Open inside LINE to submit data.", deleteDraft: "Delete this record", deleteConfirm: "Delete this record from this device and the server?", deleteError: "Unable to delete. Published businesses must be withdrawn first." },
  zh: { title: "商户资料", body: "只填写一次，Google、商户网站和海报都会复用。", basic: "基础信息", name: "商户名称", category: "商户分类", phone: "联系电话", line: "LINE联系方式（选填）", address: "经营地址", hours: "营业时间", media: "商户与商品照片", storefront: "门店或经营场所", menu: "商品、服务或价目表", product: "代表性商品或案例", add: "拍照或选择照片", replace: "更换照片", save: "仅保存到本机", saving: "正在保存…", saved: "已保存到当前设备", saveError: "保存失败，请减少照片数量后重试", helper: "图片会压缩并保存在当前浏览器中，仅用于流程测试。", import: "导入测试JSON", imported: "数据已导入，请确认后保存", export: "导出已保存数据", exportTitle: "商户资料 JSON", exportBody: "导出内容不包含照片；照片仍保存在当前设备中。", copy: "复制JSON", copied: "已复制", share: "系统分享", download: "浏览器下载", close: "关闭", reset: "重置Mock数据", invalid: "这不是可识别的商户数据文件", submitReview: "提交到服务器审核", submittingReview: "正在提交到服务器…", submittedReview: "已经提交到服务器", required: "请填写名称、分类、地址、电话和营业时间", lineRequired: "必须在LINE内才能提交数据", deleteDraft: "删除这条记录", deleteConfirm: "从当前设备和服务器删除这条记录？", deleteError: "无法删除；已发布商户需要先在后台撤回" },
};

export function ProfileForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const t = ui[locale];
  const { draft, hydrated, saveDraft, resetDraft, submitMerchant, deleteMerchant } = useMerchantDraft();
  const { idToken, isInClient, isLoggedIn } = useLiff();
  const [form, setForm] = useState<MerchantDraft>(draft);
  const [notice, setNotice] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverBusy, setServerBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const exportAreaRef = useRef<HTMLTextAreaElement>(null);

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
      const imported = normalizeMerchantDraft(parsed, draft);
      setForm({
        ...imported,
        id: draft.id,
        slug: draft.slug,
        status: draft.status,
        createdAt: draft.createdAt,
      });
      setNotice(t.imported);
    } catch {
      setNotice(t.invalid);
    }
  }

  const exportPayload = JSON.stringify({
    ...draft,
    images: { storefront: null, menu: null, product: null },
    imageStatus: {
      storefront: Boolean(draft.images.storefront),
      menu: Boolean(draft.images.menu),
      product: Boolean(draft.images.product),
    },
  }, null, 2);

  function downloadJson() {
    const blob = new Blob([exportPayload], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "merchant-launchpad-export.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(exportPayload);
    } catch {
      exportAreaRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareJson() {
    if (!navigator.share) return copyJson();
    try { await navigator.share({ title: t.exportTitle, text: exportPayload }); } catch { /* Closing the share sheet is not an error. */ }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setNotice("");
    try {
      await saveDraft(form);
      setSaveState("saved");
      setNotice(t.saved);
      navigator.vibrate?.(35);
      window.setTimeout(() => setSaveState("idle"), 2400);
    } catch {
      setSaveState("error");
      setNotice(t.saveError);
    }
  }

  async function submitForReview() {
    setNotice("");
    if (!form.name[locale].trim() || !form.category[locale].trim() || !form.address[locale].trim() || !form.phone.trim() || !form.hours.trim()) {
      setNotice(t.required);
      return;
    }
    if (!isInClient || !isLoggedIn || !idToken) {
      setNotice(t.lineRequired);
      return;
    }
    setServerBusy(true);
    try {
      await saveDraft(form);
      await submitMerchant(form, locale, idToken);
      setNotice(t.submittedReview);
      navigator.vibrate?.(35);
    } catch {
      setNotice(t.saveError);
    } finally { setServerBusy(false); }
  }

  async function removeRecord() {
    if (!window.confirm(t.deleteConfirm)) return;
    setServerBusy(true); setNotice("");
    try {
      await deleteMerchant(draft.id);
      router.push(`/${locale}`);
    } catch {
      setNotice(t.deleteError);
    } finally { setServerBusy(false); }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="form-heading"><p className="eyebrow">MERCHANT PASSPORT</p><h1>{t.title}</h1><p>{t.body}</p></div>
      <section className="test-data-toolbar">
        <div><strong>MOCK DATA</strong><p>{t.helper}</p></div>
        <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importJson(event.target.files?.[0])} />
        <button type="button" className="secondary-button" onClick={() => importRef.current?.click()}>{t.import}</button>
        <button type="button" className="secondary-button" onClick={() => setExportOpen(true)}>{t.export}</button>
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
      <button className={`save-button ${saveState}`} type="submit" disabled={saveState === "saving"}>
        <span className="save-button-icon"><Icon name="check" size={18}/></span>
        {saveState === "saving" ? t.saving : saveState === "saved" ? t.saved : t.save}
      </button>
      {draft.status !== "published" && <button className="primary-button profile-server-submit" type="button" disabled={serverBusy} onClick={() => void submitForReview()}>{serverBusy ? t.submittingReview : t.submitReview}</button>}
      <button className="reset-button danger-text" type="button" disabled={serverBusy} onClick={() => void removeRecord()}>{t.deleteDraft}</button>
      <button className="reset-button" type="button" onClick={() => { void resetDraft(); setNotice(""); setSaveState("idle"); }}>{t.reset}</button>
      {saveState !== "idle" && <div className={`action-toast ${saveState}`} role="status"><span>{saveState === "saving" ? "…" : saveState === "saved" ? "✓" : "!"}</span>{saveState === "saving" ? t.saving : saveState === "saved" ? t.saved : t.saveError}</div>}
      {exportOpen && (
        <div className="export-modal-backdrop" role="presentation" onClick={() => setExportOpen(false)}>
          <section className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(event) => event.stopPropagation()}>
            <div className="export-modal-heading"><div><p className="eyebrow">MOCK EXPORT</p><h2 id="export-title">{t.exportTitle}</h2></div><button type="button" aria-label={t.close} onClick={() => setExportOpen(false)}>×</button></div>
            <p>{t.exportBody}</p>
            <textarea ref={exportAreaRef} readOnly value={exportPayload} rows={11} />
            <div className="export-actions">
              <button className="primary-button" type="button" onClick={() => void copyJson()}>{copied ? t.copied : t.copy}</button>
              <button className="secondary-button" type="button" onClick={() => void shareJson()}>{t.share}</button>
              <button className="secondary-button" type="button" onClick={downloadJson}>{t.download}</button>
            </div>
          </section>
        </div>
      )}
    </form>
  );
}
