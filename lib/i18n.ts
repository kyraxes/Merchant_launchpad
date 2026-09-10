import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["th", "en", "zh"];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const copy = {
  th: {
    brand: "Merchant Launchpad", dashboard: "หน้าหลัก", profile: "ข้อมูลร้าน", google: "Google Maps", website: "เว็บไซต์ร้าน", posters: "โปสเตอร์",
    menu: "เมนู", hours: "เวลาเปิด", location: "ที่ตั้ง", call: "โทรหาร้าน", directions: "เปิดใน Google Maps", featured: "แนะนำ",
    mockNotice: "ข้อมูลทั้งหมดในต้นแบบนี้เป็นข้อมูลสมมติ", preview: "ดูตัวอย่าง", edit: "แก้ไข", continue: "ดำเนินการต่อ",
  },
  en: {
    brand: "Merchant Launchpad", dashboard: "Home", profile: "Store profile", google: "Google Maps", website: "Store website", posters: "Posters",
    menu: "Menu", hours: "Opening hours", location: "Location", call: "Call the store", directions: "Open in Google Maps", featured: "Featured",
    mockNotice: "All information in this prototype is fictional mock data.", preview: "Preview", edit: "Edit", continue: "Continue",
  },
  zh: {
    brand: "Merchant Launchpad", dashboard: "首页", profile: "店铺资料", google: "Google Maps", website: "店铺网站", posters: "商品海报",
    menu: "菜单", hours: "营业时间", location: "店铺位置", call: "联系商家", directions: "在Google Maps打开", featured: "招牌",
    mockNotice: "当前展示均为虚构Mock数据", preview: "预览", edit: "编辑", continue: "继续",
  },
} satisfies Record<Locale, Record<string, string>>;
