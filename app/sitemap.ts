import type { MetadataRoute } from "next";
import { merchants } from "@/data/merchants";
import { merchantUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const merchantPages = merchants
    .filter((merchant) => merchant.status === "published")
    .flatMap((merchant) => (["th", "en", "zh"] as const).map((locale) => ({
      url: merchantUrl(locale, merchant.slug),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })));
  return merchantPages;
}
