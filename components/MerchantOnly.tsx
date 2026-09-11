"use client";

import { useMerchantDraft } from "@/components/MerchantDraftProvider";

export function MerchantOnly({ children }: { children: React.ReactNode }) {
  const { merchants, hydrated } = useMerchantDraft();
  if (!hydrated || !merchants.length) return null;
  return children;
}
