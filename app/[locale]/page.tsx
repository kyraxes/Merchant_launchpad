import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { LineStatusCard } from "@/components/LineStatusCard";
import { MerchantWelcome } from "@/components/MerchantWelcome";
import { MerchantSwitcher } from "@/components/MerchantSwitcher";
import { WebsiteWorkflowStatus } from "@/components/WebsiteWorkflowStatus";
import { copy, isLocale, locales } from "@/lib/i18n";

const ui = {
  th: {
    hello: "สวัสดี",
    title: "เริ่มให้ลูกค้าค้นพบร้านของคุณ",
    subtitle: "กรอกข้อมูลร้านเพียงครั้งเดียว แล้วใช้กับเครื่องมือทั้ง 3 อย่าง",
    complete: "ข้อมูลร้านครบแล้ว",
    improve: "เพิ่มข้อมูล",
    tools: "เครื่องมือของคุณ",
    googleTitle: "ขึ้นร้านบน Google Maps",
    googleBody: "เตรียมข้อมูล ค้นหารายการเดิม และทำตามขั้นตอนยืนยัน",
    googleStatus: "รอการยืนยัน",
    webTitle: "สร้างเว็บไซต์ร้าน",
    webBody: "สร้างหน้าเว็บ 3 ภาษาให้ Google และลูกค้าค้นพบ",
    webStatus: "เผยแพร่แล้ว",
    posterTitle: "สร้างโปสเตอร์สินค้า",
    posterBody: "เลือกสินค้าและสร้างภาพพร้อมแชร์ได้ทันที",
    posterStatus: "พร้อมสร้าง",
    shared: "ข้อมูลเดียว ใช้ได้ทุกที่",
    sharedBody: "ชื่อร้าน ที่อยู่ เวลาเปิด รูป และเมนูจะถูกนำไปใช้ซ้ำ ไม่ต้องกรอกใหม่",
  },
  en: {
    hello: "Hello",
    title: "Get your store ready to be found",
    subtitle: "Enter your store information once, then reuse it across all three tools.",
    complete: "Store profile complete",
    improve: "Improve profile",
    tools: "Your tools",
    googleTitle: "Launch on Google Maps",
    googleBody: "Prepare your listing, find duplicates and follow the verification steps.",
    googleStatus: "Verification pending",
    webTitle: "Create your store website",
    webBody: "Publish a trilingual page that Google and customers can discover.",
    webStatus: "Published",
    posterTitle: "Create a product poster",
    posterBody: "Choose a product and make a ready-to-share visual.",
    posterStatus: "Ready to create",
    shared: "One profile, used everywhere",
    sharedBody: "Your name, address, hours, photos and menu are reused automatically. No repeated forms.",
  },
  zh: {
    hello: "你好",
    title: "让更多顾客找到你的店",
    subtitle: "店铺资料只填写一次，三个工具都可以直接使用。",
    complete: "店铺资料已完成",
    improve: "完善资料",
    tools: "你的工具",
    googleTitle: "把店铺上线 Google Maps",
    googleBody: "整理资料、查找重复条目，并引导你完成验证。",
    googleStatus: "等待验证",
    webTitle: "创建自己的店铺网站",
    webBody: "发布中泰英三语网页，让Google和顾客找到你。",
    webStatus: "已经发布",
    posterTitle: "生成商品海报",
    posterBody: "选择商品，一键制作可直接分享的海报。",
    posterStatus: "可以开始",
    shared: "一份资料，三处使用",
    sharedBody: "店名、地址、营业时间、照片和菜单会自动复用，不需要重复填写。",
  },
};

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = ui[locale];
  const common = copy[locale];
  return (
    <>
      <Header locale={locale} />
      <main className="app-main dashboard-main">
        <LineStatusCard locale={locale} />
        <MerchantSwitcher locale={locale} />
        <MerchantWelcome locale={locale} />

        <section className="tool-section">
          <div className="section-title"><div><p className="eyebrow">V1</p><h2>{t.tools}</h2></div><span>3</span></div>
          <div className="tool-grid">
            <Link className="tool-card google-tool" href={`/${locale}/google`}>
              <span className="tool-icon"><Icon name="map" size={27}/></span>
              <span className="status-chip waiting">{t.googleStatus}</span>
              <h3>{t.googleTitle}</h3><p>{t.googleBody}</p>
              <span className="tool-action">{common.continue}<Icon name="arrow" size={17}/></span>
            </Link>
            <Link className="tool-card website-tool" href={`/${locale}/website`}>
              <span className="tool-icon"><Icon name="globe" size={27}/></span>
              <WebsiteWorkflowStatus locale={locale} compact />
              <h3>{t.webTitle}</h3><p>{t.webBody}</p>
              <span className="tool-action">{common.edit}<Icon name="arrow" size={17}/></span>
            </Link>
            <Link className="tool-card poster-tool" href={`/${locale}/posters`}>
              <span className="tool-icon"><Icon name="poster" size={27}/></span>
              <span className="status-chip ready">{t.posterStatus}</span>
              <h3>{t.posterTitle}</h3><p>{t.posterBody}</p>
              <span className="tool-action">{common.continue}<Icon name="arrow" size={17}/></span>
            </Link>
          </div>
        </section>

        <section className="shared-data-card">
          <span><Icon name="sparkles" size={24}/></span>
          <div><h2>{t.shared}</h2><p>{t.sharedBody}</p></div>
          <Link href={`/${locale}/profile`}>{common.edit}</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
