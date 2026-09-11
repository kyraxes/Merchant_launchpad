import type { MetadataRoute } from "next";
import { merchants } from "@/data/merchants";
import { merchantUrl } from "@/lib/site";
import { listSubmissions } from "@/lib/server/submission-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const merchantPages = merchants
    .filter((merchant) => merchant.status === "published")
    .flatMap((merchant) => (["th", "en", "zh"] as const).map((locale) => ({
      url: merchantUrl(locale, merchant.slug),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })));
  const livePages = (await listSubmissions())
    .filter((submission) => submission.status === "approved")
    .flatMap((submission) => (["th", "en", "zh"] as const).map((locale) => ({
      url: merchantUrl(locale, submission.id),
      lastModified: new Date(submission.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })));
  return [...merchantPages, ...livePages];
}
