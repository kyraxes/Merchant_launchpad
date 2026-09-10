import type { Locale, LocalizedText, Merchant } from "@/lib/types";

export type DraftImageKind = "storefront" | "menu" | "product";

export type MerchantDraft = {
  version: 1;
  name: LocalizedText;
  category: LocalizedText;
  address: LocalizedText;
  phone: string;
  lineId: string;
  hours: string;
  images: Record<DraftImageKind, string | null>;
  updatedAt: string | null;
};

export function merchantToDraft(merchant: Merchant): MerchantDraft {
  return {
    version: 1,
    name: merchant.name,
    category: merchant.category,
    address: merchant.address,
    phone: merchant.phone,
    lineId: merchant.lineId,
    hours: `${merchant.openingHours[0].days.th} · ${merchant.openingHours[0].hours}`,
    images: { storefront: null, menu: null, product: null },
    updatedAt: null,
  };
}

function localized(value: unknown, fallback: LocalizedText): LocalizedText {
  if (!value || typeof value !== "object") return fallback;
  const source = value as Partial<Record<Locale, unknown>>;
  return {
    th: typeof source.th === "string" ? source.th : fallback.th,
    en: typeof source.en === "string" ? source.en : fallback.en,
    zh: typeof source.zh === "string" ? source.zh : fallback.zh,
  };
}

export function normalizeMerchantDraft(value: unknown, fallback: MerchantDraft): MerchantDraft {
  if (!value || typeof value !== "object") throw new Error("Invalid merchant data");
  const source = value as Partial<MerchantDraft>;
  const images = source.images && typeof source.images === "object" ? source.images : fallback.images;
  return {
    version: 1,
    name: localized(source.name, fallback.name),
    category: localized(source.category, fallback.category),
    address: localized(source.address, fallback.address),
    phone: typeof source.phone === "string" ? source.phone : fallback.phone,
    lineId: typeof source.lineId === "string" ? source.lineId : fallback.lineId,
    hours: typeof source.hours === "string" ? source.hours : fallback.hours,
    images: {
      storefront: typeof images.storefront === "string" ? images.storefront : null,
      menu: typeof images.menu === "string" ? images.menu : null,
      product: typeof images.product === "string" ? images.product : null,
    },
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
  };
}
