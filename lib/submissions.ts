import type { Locale } from "@/lib/types";

export type SubmissionStatus = "review" | "approved" | "rejected";
export type SubmissionImageKind = "storefront" | "menu" | "product";

export type MerchantSubmissionInput = {
  clientSubmissionId: string;
  locale: Locale;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  lineId: string;
  images: Record<SubmissionImageKind, string | null>;
};

export type MerchantSubmission = Omit<MerchantSubmissionInput, "images"> & {
  id: string;
  ownerLineUserId: string;
  ownerDisplayName: string;
  status: SubmissionStatus;
  imageKeys: Record<SubmissionImageKind, string | null>;
  submittedAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

const locales: Locale[] = ["th", "en", "zh"];
const imageKinds: SubmissionImageKind[] = ["storefront", "menu", "product"];

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanImage(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 1_600_000 || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(value)) {
    throw new Error("INVALID_IMAGE");
  }
  return value;
}

export function parseSubmissionInput(value: unknown): MerchantSubmissionInput {
  if (!value || typeof value !== "object") throw new Error("INVALID_BODY");
  const source = value as Record<string, unknown>;
  const locale = locales.includes(source.locale as Locale) ? source.locale as Locale : null;
  const sourceImages = source.images && typeof source.images === "object" ? source.images as Record<string, unknown> : {};
  if (!locale) throw new Error("INVALID_LOCALE");

  const input: MerchantSubmissionInput = {
    clientSubmissionId: cleanText(source.clientSubmissionId, 100),
    locale,
    name: cleanText(source.name, 120),
    category: cleanText(source.category, 100),
    address: cleanText(source.address, 400),
    phone: cleanText(source.phone, 40),
    hours: cleanText(source.hours, 160),
    lineId: cleanText(source.lineId, 80),
    images: { storefront: null, menu: null, product: null },
  };
  for (const kind of imageKinds) input.images[kind] = cleanImage(sourceImages[kind]);
  if (!input.clientSubmissionId || !input.name || !input.category || !input.address || !input.phone || !input.hours) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }
  return input;
}

export function publicSubmission(submission: MerchantSubmission) {
  return {
    id: submission.id,
    locale: submission.locale,
    name: submission.name,
    category: submission.category,
    address: submission.address,
    phone: submission.phone,
    hours: submission.hours,
    lineId: submission.lineId,
    status: submission.status,
    imageCount: Object.values(submission.imageKeys).filter(Boolean).length,
    submittedAt: submission.submittedAt,
    updatedAt: submission.updatedAt,
    reviewedAt: submission.reviewedAt,
  };
}
