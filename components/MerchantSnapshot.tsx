"use client";

import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";

const ready = { th: "ข้อมูลพร้อมส่ง", en: "Listing data ready", zh: "上线资料已经准备好" };

export function MerchantSnapshot({ locale, fallbackEmoji }: { locale: Locale; fallbackEmoji: string }) {
  const { draft } = useMerchantDraft();
  return (
    <section className="merchant-snapshot">
      {draft.images.storefront ? <img className="snapshot-photo" src={draft.images.storefront} alt="" /> : <span className="snapshot-art">{fallbackEmoji}</span>}
      <div><strong>{draft.name[locale]}</strong><p>{draft.category[locale]} · {draft.address[locale]}</p></div>
      <span className="ready-label"><Icon name="check" size={15}/>{ready[locale]}</span>
    </section>
  );
}
