import type { Locale, LocalizedText, MenuSection, Merchant } from "@/lib/types";

export type DraftImageKind = "storefront" | "menu" | "product";
export type MerchantWorkflowStatus = "draft" | "review" | "published" | "rejected";

export type MerchantDraft = {
  version: 2;
  id: string;
  slug: string;
  status: MerchantWorkflowStatus;
  name: LocalizedText;
  category: LocalizedText;
  address: LocalizedText;
  area: LocalizedText;
  tagline: LocalizedText;
  phone: string;
  lineId: string;
  hours: string;
  images: Record<DraftImageKind, string | null>;
  menu: MenuSection[];
  accent: string;
  accentSoft: string;
  emoji: string;
  createdAt: string;
  updatedAt: string | null;
};

export type MerchantEventType = "created" | "saved" | "submitted" | "published" | "unpublished" | "selected";

export type MerchantEvent = {
  id: string;
  merchantId: string;
  type: MerchantEventType;
  at: string;
};

export type MerchantWorkspace = {
  version: 2;
  selectedId: string;
  merchants: MerchantDraft[];
  events: MerchantEvent[];
};

const now = () => new Date().toISOString();

export function localizedValue(value: LocalizedText, locale: Locale) {
  return value[locale] || value.th || value.en || value.zh;
}

export function merchantToDraft(merchant: Merchant): MerchantDraft {
  return {
    version: 2,
    id: merchant.id,
    slug: merchant.slug,
    status: merchant.status === "published" ? "published" : "draft",
    name: merchant.name,
    category: merchant.category,
    address: merchant.address,
    area: merchant.area,
    tagline: merchant.tagline,
    phone: merchant.phone,
    lineId: merchant.lineId,
    hours: `${merchant.openingHours[0].days.th} · ${merchant.openingHours[0].hours}`,
    images: { storefront: null, menu: null, product: null },
    menu: merchant.menu,
    accent: merchant.accent,
    accentSoft: merchant.accentSoft,
    emoji: merchant.emoji,
    createdAt: now(),
    updatedAt: null,
  };
}

export function createEmptyMerchantDraft(id: string, locale: Locale): MerchantDraft {
  const blank = { th: "", en: "", zh: "" };
  const category = { th: "ธุรกิจท้องถิ่น", en: "Local business", zh: "本地商户" };
  const tagline = { th: "ธุรกิจของคุณในชุมชน", en: "Your local business", zh: "你身边的本地商户" };
  const defaultProduct = {
    id: "first-product",
    name: { th: "สินค้าหรือบริการแนะนำ", en: "Featured product or service", zh: "主推商品或服务" },
    description: { th: "เพิ่มรายละเอียดภายหลัง", en: "Add details later", zh: "稍后完善详细信息" },
    price: 0,
    featured: true,
  };
  return {
    version: 2,
    id,
    slug: `mock-store-${id.slice(-6).toLowerCase()}`,
    status: "draft",
    name: blank,
    category,
    address: blank,
    area: blank,
    tagline,
    phone: "",
    lineId: "",
    hours: "",
    images: { storefront: null, menu: null, product: null },
    menu: [{ id: "featured", name: { th: "สินค้าและบริการ", en: "Products and services", zh: "商品与服务" }, items: [defaultProduct] }],
    accent: "#147d64",
    accentSoft: "#e7f5ef",
    emoji: "🏪",
    createdAt: now(),
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
  const status: MerchantWorkflowStatus = source.status === "review" || source.status === "published" || source.status === "rejected" ? source.status : "draft";
  return {
    version: 2,
    id: typeof source.id === "string" ? source.id : fallback.id,
    slug: typeof source.slug === "string" ? source.slug : fallback.slug,
    status,
    name: localized(source.name, fallback.name),
    category: localized(source.category, fallback.category),
    address: localized(source.address, fallback.address),
    area: localized(source.area, fallback.area),
    tagline: localized(source.tagline, fallback.tagline),
    phone: typeof source.phone === "string" ? source.phone : fallback.phone,
    lineId: typeof source.lineId === "string" ? source.lineId : fallback.lineId,
    hours: typeof source.hours === "string" ? source.hours : fallback.hours,
    images: {
      storefront: typeof images.storefront === "string" ? images.storefront : null,
      menu: typeof images.menu === "string" ? images.menu : null,
      product: typeof images.product === "string" ? images.product : null,
    },
    menu: Array.isArray(source.menu) && source.menu.length ? source.menu : fallback.menu,
    accent: typeof source.accent === "string" ? source.accent : fallback.accent,
    accentSoft: typeof source.accentSoft === "string" ? source.accentSoft : fallback.accentSoft,
    emoji: typeof source.emoji === "string" ? source.emoji : fallback.emoji,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : fallback.createdAt,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
  };
}

export function profileCompletion(draft: MerchantDraft) {
  const values = [draft.name.th || draft.name.en || draft.name.zh, draft.category.th || draft.category.en || draft.category.zh, draft.phone, draft.address.th || draft.address.en || draft.address.zh, draft.hours];
  return Math.round(values.filter(Boolean).length / values.length * 100);
}
