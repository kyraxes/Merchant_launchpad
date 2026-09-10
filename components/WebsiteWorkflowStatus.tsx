"use client";

import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";

const text = {
  th: { draft: "ฉบับร่าง", review: "รอตรวจ", published: "เผยแพร่แล้ว" },
  en: { draft: "Draft", review: "In review", published: "Published" },
  zh: { draft: "草稿", review: "等待审核", published: "已经发布" },
};

export function WebsiteWorkflowStatus({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const { draft } = useMerchantDraft();
  if (compact) return <span className={`status-chip ${draft.status === "published" ? "live" : "waiting"}`}>{draft.status === "published" && <Icon name="check" size={13}/>} {text[locale][draft.status]}</span>;
  return <span className={`module-status ${draft.status === "published" ? "live" : "waiting"}`}>{draft.status === "published" ? <Icon name="check" size={15}/> : <span/>}{text[locale][draft.status]}</span>;
}
