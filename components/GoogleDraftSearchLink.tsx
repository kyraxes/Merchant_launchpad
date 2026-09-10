"use client";

import type { Locale } from "@/lib/types";
import { useMerchantDraft } from "@/components/MerchantDraftProvider";
import { Icon } from "@/components/Icon";

export function GoogleDraftSearchLink({ locale, label }: { locale: Locale; label: string }) {
  const { draft } = useMerchantDraft();
  const query = encodeURIComponent(`${draft.name[locale]} ${draft.address[locale]}`);
  return <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer">{label}<Icon name="external" size={15}/></a>;
}
