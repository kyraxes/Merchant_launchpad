import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { isLocale, locales } from "@/lib/i18n";
import { WebsiteDraftPreview } from "@/components/WebsiteDraftPreview";
import { WebsiteWorkflowStatus } from "@/components/WebsiteWorkflowStatus";

const ui = {
  th: { kicker: "BUSINESS WEBSITE", title: "เว็บไซต์ธุรกิจของคุณ", body: "เราสร้างหน้าเว็บสาธารณะจากข้อมูลธุรกิจ เพื่อให้ Google และลูกค้าค้นพบ", published: "เผยแพร่แล้ว", url: "ที่อยู่เว็บไซต์", view: "เปิดเว็บไซต์", edit: "แก้ไขเนื้อหา", content: "เนื้อหาในเว็บไซต์", info: "ข้อมูลธุรกิจ", infoBody: "ชื่อ หมวดหมู่ คำแนะนำ ที่อยู่ เวลาเปิด และเบอร์โทร", menu: "สินค้า บริการ และราคา", menuBody: "ข้อความที่ Google อ่านได้ ไม่ใช่เพียงรูปภาพ", languages: "3 ภาษา", languagesBody: "ไทย อังกฤษ และจีน มี URL แยกกัน", seo: "พร้อมสำหรับ Google", seoBody: "ชื่อหน้า ข้อมูลโครงสร้าง sitemap และหน้าโหลดเร็ว", publicOnly: "นี่คือฟังก์ชันเดียวใน V1 ที่สร้างหน้าเว็บเพิ่มเติม", next: "ขั้นตอนต่อไป", nextBody: "ตรวจข้อมูลและดูตัวอย่าง เมื่อใช้ข้อมูลจริงแล้วจึงเปิดให้ Google เก็บข้อมูล" },
  en: { kicker: "BUSINESS WEBSITE", title: "Your business website", body: "We turn your business profile into a public page that Google and customers can find.", published: "Published", url: "Website address", view: "Open website", edit: "Edit content", content: "Website content", info: "Business information", infoBody: "Name, category, introduction, address, hours and phone", menu: "Products, services and prices", menuBody: "Readable HTML text, not only an uploaded image", languages: "3 languages", languagesBody: "Thai, English and Chinese use separate URLs", seo: "Google-ready foundation", seoBody: "Page metadata, structured data, sitemap and fast mobile layout", publicOnly: "This is the only V1 tool that creates an additional public web page.", next: "Next step", nextBody: "Review the information and preview it. Enable Google indexing only after real business data is confirmed." },
  zh: { kicker: "BUSINESS WEBSITE", title: "你的商户网站", body: "我们把商户资料做成公开网页，让Google和顾客能够找到。", published: "已经发布", url: "网站地址", view: "打开商户网站", edit: "编辑内容", content: "网站包含的内容", info: "商户基本信息", infoBody: "名称、分类、介绍、地址、营业时间和联系电话", menu: "商品、服务与价格", menuBody: "Google可以读取的网页文字，而不只是一张上传图片", languages: "中泰英三种语言", languagesBody: "每种语言都有独立且稳定的网址", seo: "Google收录基础", seoBody: "页面标题、结构化数据、站点地图和移动端速度", publicOnly: "这是V1三个工具中，唯一会额外生成公开网页的功能。", next: "下一步", nextBody: "确认资料并预览；换成经过商家确认的真实数据后，再允许Google收录。" },
};

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function WebsitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = ui[locale];
  const items = [
    { icon: "store" as const, title: t.info, body: t.infoBody },
    { icon: "poster" as const, title: t.menu, body: t.menuBody },
    { icon: "globe" as const, title: t.languages, body: t.languagesBody },
    { icon: "sparkles" as const, title: t.seo, body: t.seoBody },
  ];
  return <>
    <Header locale={locale}/>
    <main className="app-main module-main">
      <section className="module-heading website-heading">
        <span className="module-big-icon"><Icon name="globe" size={31}/></span>
        <p className="eyebrow">{t.kicker}</p><h1>{t.title}</h1><p>{t.body}</p>
        <WebsiteWorkflowStatus locale={locale} />
      </section>
      <WebsiteDraftPreview locale={locale} />
      <section className="content-section"><div className="section-title"><h2>{t.content}</h2></div><div className="content-grid">{items.map((item) => <article key={item.title}><span><Icon name={item.icon} size={21}/></span><div><h3>{item.title}</h3><p>{item.body}</p></div><Icon name="check" size={18}/></article>)}</div></section>
      <aside className="public-note"><Icon name="globe" size={22}/><div><strong>{t.publicOnly}</strong><p>{t.nextBody}</p></div></aside>
    </main>
    <Footer/>
  </>;
}
