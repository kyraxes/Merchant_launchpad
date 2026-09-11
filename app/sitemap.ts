import type { MetadataRoute } from "next";
import { merchantUrl } from "@/lib/site";
import { listSubmissions } from "@/lib/server/submission-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const livePages = (await listSubmissions())
    .filter((submission) => submission.status === "approved")
    .flatMap((submission) => (["th", "en", "zh"] as const).map((locale) => ({
      url: merchantUrl(locale, submission.id),
      lastModified: new Date(submission.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })));
  return livePages;
}
