"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { MenuList } from "@/components/MenuList";
import { compressImage } from "@/lib/browser-image";
import { canPublish, emptyMenu, type MenuRecord, type MenuRow } from "@/lib/menu";
import { menuCopy } from "@/lib/menu-copy";
import type { Locale } from "@/lib/types";

export function MenuStudio({ locale }: { locale: Locale }) {
  const { draft } = useMerchantDraft();
  // Switching a legacy merchant discards only this editor's state.
  return <MenuEditor key={draft.id} merchantId={draft.id} locale={locale}/>;
}

function MenuEditor({ merchantId, locale }: { merchantId: string; locale: Locale }) {
  const { user } = useAccount();
  const t = menuCopy[locale];
  const [menu, setMenu] = useState<MenuRecord>(emptyMenu);
  const [approved, setApproved] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const locked = useRef(false);
  const alive = useRef(true);
  const endpoint = `/api/submissions/${merchantId}/menu`;

  useEffect(() => { alive.current = true; setUrl(`${window.location.origin}/${locale}/stores/${merchantId}/menu`); return () => { alive.current = false; }; }, [locale, merchantId]);
  useEffect(() => {
    if (!dirty && !photos.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, photos.length]);

  function errorText(code: string) {
    if (code === "MENU_CONFLICT") return t.conflict;
    if (code === "CONFIRM_MENU" || code === "INVALID_MENU") return t.check;
    if (code === "MERCHANT_NOT_APPROVED") return t.pending;
    if (code === "LINE_TOKEN_REQUIRED" || code === "INVALID_LINE_TOKEN") return t.auth;
    if (code === "INVALID_IMAGES" || code === "PAYLOAD_TOO_LARGE") return t.fileError;
    return t.failed;
  }

  async function request(body?: object) {
    const response = await fetch(endpoint, {
      method: body ? "POST" : "GET", cache: "no-store",
      headers: { ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(45_000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "MENU_FAILED");
    return result as { menu: MenuRecord; approved: boolean };
  }

  async function reload(ask = true) {
    if (locked.current || (ask && (dirty || photos.length > 0) && !window.confirm(t.reloadConfirm))) return;
    locked.current = true; setBusy(true); setError(""); setMessage(t.loading);
    try {
      const result = await request();
      if (!alive.current) return;
      setMenu(result.menu); setApproved(result.approved); setReady(true); setDirty(false); setPhotos([]); setMessage("");
    } catch (caught) { if (alive.current) { setError(errorText(caught instanceof Error ? caught.message : "")); setMessage(""); } }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }

  useEffect(() => { void reload(false); }, [user?.id]); // Deliberately no visibility/focus reload: preserve edits after the photo picker.

  async function selectPhotos(files: File[]) {
    if (locked.current || !files.length) return;
    if (files.length > 5 || files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15_000_000)) { setError(t.fileError); return; }
    locked.current = true; setBusy(true); setError(""); setMessage(t.uploading);
    try {
      const selected: string[] = [];
      for (const file of files) selected.push(await compressImage(file, true));
      if (alive.current) { setPhotos(selected); setMessage(t.sourcesPending); }
    } catch { if (alive.current) { setError(t.fileError); setMessage(""); } }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }

  async function action(action: "import" | "save" | "publish" | "unpublish") {
    if (!ready || locked.current) return;
    if (action === "import" && menu.rows.length && !window.confirm(t.replace)) return;
    if (action === "unpublish" && !window.confirm(t.unpublishConfirm)) return;
    if (action === "publish" && !canPublish(menu.rows)) { setError(t.check); return; }
    locked.current = true; setBusy(true); setError(""); setMessage(t.working);
    try {
      const result = await request({ action, revision: menu.revision, rows: menu.rows, ...(action === "import" ? { images: photos } : {}) });
      if (!alive.current) return;
      setMenu(result.menu); setApproved(result.approved); setDirty(false); setPhotos([]);
      setMessage(action === "publish" ? t.published : action === "unpublish" ? t.unpublished : t.saved);
    } catch (caught) { if (alive.current) { setError(errorText(caught instanceof Error ? caught.message : "")); setMessage(""); } }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }

  function update(id: string, change: Partial<MenuRow>) {
    setMenu(current => ({ ...current, rows: current.rows.map(row => row.id === id ? { ...row, ...change, confirmed: "confirmed" in change ? !!change.confirmed : false } : row) }));
    setDirty(true); setMessage("");
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setMessage(t.copied); } catch { setMessage(t.copyFallback); }
  }
  async function downloadQR() {
    try {
      const QRCode = await import("qrcode");
      const data = await QRCode.toDataURL(url, { width: 640, margin: 3 });
      setQr(data);
      const link = document.createElement("a"); link.href = data; link.download = `menu-${merchantId}.png`; link.click();
      setMessage(t.qrReady);
    } catch { setError(t.failed); }
  }

  return <div className="menu-studio">
    <div><p className="eyebrow">MENU</p><h1>{t.title}</h1><p>{t.intro}</p></div>
    <aside className="menu-notice">{t.mock}</aside>
    <div className="menu-feedback" aria-live="polite" aria-atomic="true">{message || (busy ? t.loading : !ready ? t.offline : dirty ? t.dirty : t.clean)}</div>
    {error && <p className="menu-error" role="alert">{error}</p>}
    <button className="secondary-button" disabled={busy} onClick={() => void reload()}>{t.reload}</button>
    {ready && <>
      <section className="form-card">
        <fieldset disabled={busy}>
          <label className="menu-upload">{t.upload}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void selectPhotos(files); }}/></label>
          <a href="/test-data/mock-menu.png" download="test-menu.png">{t.sample}</a>
          {photos.length > 0 && <><div className="menu-sources">{photos.map((photo, index) => <figure key={index}><img src={photo} alt={`${t.source} ${index + 1}`}/><button onClick={() => setPhotos(current => current.filter((_, i) => i !== index))}>{t.removePhoto}</button></figure>)}</div><p>{t.sourcesPending}</p><button className="primary-button" onClick={() => void action("import")}>{t.import}</button></>}
        </fieldset>
      </section>
      {menu.images.length > 0 && <details className="form-card" open><summary>{t.source}</summary><div className="menu-sources">{menu.images.map((photo, index) => <button className="menu-source-button" key={index} aria-label={`${t.source} ${index + 1}`} onClick={() => setExpandedPhoto(expandedPhoto === photo ? null : photo)}><img src={photo} alt={`${t.source} ${index + 1}`}/></button>)}</div>{expandedPhoto && <img className="menu-expanded-photo" src={expandedPhoto} alt={t.source}/>}</details>}
      <fieldset disabled={busy || photos.length > 0}>
        {!menu.rows.length && <p className="menu-notice">{t.empty}</p>}
        {menu.rows.map((row, index) => <section className="form-card menu-editor-row" key={row.id}>
          <div className="menu-row-heading"><strong>{index + 1}. {row.name || t.name}</strong>{!row.confirmed && <span>{t.review}</span>}<button type="button" onClick={() => { setMenu(current => ({ ...current, rows: current.rows.filter(item => item.id !== row.id) })); setDirty(true); }}>{t.remove}</button></div>
          <div className="menu-fields">
            <label>{t.name}<input maxLength={160} value={row.name} onChange={event => update(row.id, { name: event.target.value })}/></label>
            <label>{t.section}<input maxLength={80} value={row.section} onChange={event => update(row.id, { section: event.target.value })}/></label>
            <label>{t.variant}<input maxLength={100} value={row.variant} onChange={event => update(row.id, { variant: event.target.value })}/></label>
            <label>{t.price}<input inputMode="decimal" maxLength={16} placeholder="60.00" value={row.price} onChange={event => update(row.id, { price: event.target.value })}/></label>
          </div>
          <label className="menu-check"><input type="checkbox" checked={row.available} onChange={event => update(row.id, { available: event.target.checked })}/>{t.available}</label>
          <label className="menu-check"><input type="checkbox" checked={row.confirmed} onChange={event => update(row.id, { confirmed: event.target.checked })}/>{t.confirmed}</label>
        </section>)}
        <button className="secondary-button" disabled={menu.rows.length >= 100} onClick={() => { setMenu(current => ({ ...current, rows: [...current.rows, { id: crypto.randomUUID(), name: "", section: "", variant: "", price: "", available: true, confirmed: false }] })); setDirty(true); }}>{t.add}</button>
        <p>{t.changes}</p>
        {!approved && <p className="menu-notice">{t.pending}</p>}
        <div className="menu-actions"><button className="secondary-button" onClick={() => void action("save")}>{t.save}</button><button className="primary-button" disabled={!approved || !canPublish(menu.rows)} onClick={() => void action("publish")}>{t.publish}</button></div>
      </fieldset>
      {menu.rows.length > 0 && <details className="form-card"><summary>{t.preview}</summary><MenuList rows={menu.rows} locale={locale}/></details>}
      {menu.published && <section className="form-card menu-share"><h2>{t.version} {menu.published.version}</h2><p>{new Date(menu.published.at).toLocaleString(locale)}</p>{approved ? <><a className="primary-button" href={url} target="_blank" rel="noreferrer">{t.public}</a><input aria-label={t.copy} readOnly value={url} onFocus={event => event.target.select()}/><div className="menu-actions"><button className="secondary-button" onClick={() => void copyLink()}>{t.copy}</button><button className="secondary-button" onClick={() => void downloadQR()}>{t.qr}</button></div>{qr && <img className="menu-qr" src={qr} alt={t.qr}/>}</> : <p>{t.pending}</p>}<button className="reset-button" disabled={busy || dirty || photos.length > 0} onClick={() => void action("unpublish")}>{t.unpublish}</button></section>}
    </>}
  </div>;
}
