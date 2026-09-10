"use client";

import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";
import { localizedValue } from "@/lib/merchant-draft";

const ready = { th: "ข้อมูลพร้อมส่ง", en: "Listing data ready", zh: "上线资料已经准备好" };

export function MerchantSnapshot({ locale }: { locale: Locale }) {
  const { draft } = useMerchantDraft();
  return (
    <section className="merchant-snapshot">
      {draft.images.storefront ? <img className="snapshot-photo" src={draft.images.storefront} alt="" /> : <span className="snapshot-art">{draft.emoji}</span>}
      <div><strong>{localizedValue(draft.name, locale)}</strong><p>{localizedValue(draft.category, locale)} · {localizedValue(draft.address, locale)}</p></div>
      <span className="ready-label"><Icon name="check" size={15}/>{ready[locale]}</span>
    </section>
  );
}
