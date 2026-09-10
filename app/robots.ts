import type { MetadataRoute } from "next";
import { mockMode, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (mockMode) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` };
}
