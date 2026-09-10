"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { localizedValue } from "@/lib/merchant-draft";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";

const text = {
  th: { label: "ร้านที่กำลังใช้งาน", add: "เพิ่มร้าน", adding: "กำลังสร้าง…", admin: "จัดการข้อมูล", draft: "ฉบับร่าง", review: "รอตรวจ", published: "เผยแพร่แล้ว" },
  en: { label: "Active store", add: "Add store", adding: "Creating…", admin: "Mock admin", draft: "Draft", review: "In review", published: "Published" },
  zh: { label: "当前店铺", add: "创建店铺", adding: "正在创建…", admin: "Mock管理后台", draft: "草稿", review: "待审核", published: "已发布" },
};

export function MerchantSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { draft, merchants, createMerchant, selectMerchant } = useMerchantDraft();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const t = text[locale];

  async function create() {
    setBusy(true); setError(false);
    try { await createMerchant(locale); router.push(`/${locale}/onboarding`); } catch { setError(true); } finally { setBusy(false); }
  }

  async function select(id: string) {
    setBusy(true); setError(false);
    try { await selectMerchant(id); } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <section className="merchant-switcher">
      <label><span>{t.label}</span><select value={draft.id} disabled={busy} onChange={(event) => void select(event.target.value)}>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{localizedValue(merchant.name, locale)} · {t[merchant.status]}</option>)}</select></label>
      <button type="button" onClick={() => void create()} disabled={busy}>{busy ? t.adding : `＋ ${t.add}`}</button>
      <Link href="/admin">{t.admin}</Link>
      {error && <small className="switcher-error">Mock request failed</small>}
    </section>
  );
}
