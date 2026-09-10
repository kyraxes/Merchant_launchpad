export type Locale = "th" | "en" | "zh";

export type LocalizedText = Record<Locale, string>;

export type MenuItem = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  featured?: boolean;
};

export type MenuSection = {
  id: string;
  name: LocalizedText;
  items: MenuItem[];
};

export type OpeningPeriod = {
  days: LocalizedText;
  hours: string;
};

export type GoogleStatus = "not-created" | "unclaimed" | "verification-needed" | "verified";
export type WebsiteStatus = "not-created" | "draft" | "published";

export type Merchant = {
  id: string;
  slug: string;
  status: "draft" | "published";
  mock: true;
  name: LocalizedText;
  category: LocalizedText;
  categoryId: string;
  area: LocalizedText;
  district: string;
  description: LocalizedText;
  tagline: LocalizedText;
  address: LocalizedText;
  phone: string;
  lineId: string;
  priceRange: string;
  cuisines: string[];
  coordinates: { lat: number; lng: number };
  openingHours: OpeningPeriod[];
  menu: MenuSection[];
  googleStatus: GoogleStatus;
  websiteStatus: WebsiteStatus;
  profileCompletion: number;
  missingGoogleFields: LocalizedText[];
  accent: string;
  accentSoft: string;
  emoji: string;
};
