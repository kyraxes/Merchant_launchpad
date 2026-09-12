export type MenuRow = {
  id: string;
  name: string;
  section: string;
  variant: string;
  price: string;
  available: boolean;
  confirmed: boolean;
};

export type MenuRecord = {
  revision: number;
  updatedAt: string;
  images: string[];
  source: "mock" | "manual";
  rows: MenuRow[];
  published: { rows: MenuRow[]; source: "mock" | "manual"; at: string; version: number } | null;
};

export function emptyMenu(): MenuRecord {
  return { revision: 0, updatedAt: "", images: [], source: "manual", rows: [], published: null };
}

export function priceMinor(price: string): number | null {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(price)) return null;
  const [whole, decimals = ""] = price.split(".");
  const value = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
  return value > 0 ? value : null;
}

export function parseMenuRows(value: unknown): MenuRow[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("INVALID_MENU");
  const ids = new Set<string>();
  return value.map((row: unknown) => {
    if (!row || typeof row !== "object") throw new Error("INVALID_MENU");
    const r = row as Record<string, unknown>;
    for (const [key, limit] of [["id", 80], ["name", 160], ["section", 80], ["variant", 100], ["price", 16]] as const) {
      if (typeof r[key] !== "string" || r[key].length > limit) throw new Error("INVALID_MENU");
    }
    if (!r.id || ids.has(r.id as string) || typeof r.available !== "boolean" || typeof r.confirmed !== "boolean") throw new Error("INVALID_MENU");
    ids.add(r.id as string);
    return { id: r.id as string, name: (r.name as string).trim(), section: (r.section as string).trim(), variant: (r.variant as string).trim(), price: (r.price as string).trim(), available: r.available, confirmed: r.confirmed };
  });
}

export function canPublish(rows: MenuRow[]) {
  return rows.length > 0 && rows.every(row => row.confirmed && row.name && priceMinor(row.price) !== null);
}

// A deterministic fixture, deliberately unrelated to uploaded image contents.
export function mockMenuRows(): MenuRow[] {
  return [
    { id: "sample-1", section: "อาหาร / Food", name: "ข้าวผัด / Fried rice", variant: "ธรรมดา / Regular", price: "60", available: true, confirmed: false },
    { id: "sample-2", section: "อาหาร / Food", name: "ผัดกะเพรา / Basil stir-fry", variant: "", price: "", available: true, confirmed: false },
    { id: "sample-3", section: "เครื่องดื่ม / Drinks", name: "ชาไทย / Thai tea", variant: "เย็น / Iced", price: "35", available: true, confirmed: false },
  ];
}

export function parseMenuImages(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) throw new Error("INVALID_IMAGES");
  return value.map(image => {
    if (typeof image !== "string" || image.length > 700_000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new Error("INVALID_IMAGES");
    return image;
  });
}
