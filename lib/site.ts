export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE !== "false";

export function merchantUrl(locale: string, slug: string) {
  return `${siteUrl}/${locale}/stores/${slug}`;
}

export function googleMapsSearchUrl(name: string, lat: number, lng: number) {
  const query = encodeURIComponent(`${name} ${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
