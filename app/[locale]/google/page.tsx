import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { isLocale, locales } from "@/lib/i18n";
import { MerchantSnapshot } from "@/components/MerchantSnapshot";
import { GoogleDraftSearchLink } from "@/components/GoogleDraftSearchLink";
import { MerchantRouteGate } from "@/components/MerchantRouteGate";

const ui = {
  th: { kicker: "GOOGLE MAPS", title: "นำร้านขึ้น Google Maps", body: "เราเตรียมข้อมูลและบอกขั้นตอนต่อไป การเข้าสู่ระบบและยืนยันต้องทำโดยเจ้าของร้าน", status: "รอการยืนยันจากเจ้าของร้าน", ready: "ข้อมูลพร้อมส่ง", step1: "ค้นหาร้านเดิม", step1body: "ตรวจว่ามีโปรไฟล์ของร้านนี้อยู่แล้วหรือไม่", step2: "ตรวจข้อมูลร้าน", step2body: "ชื่อ หมวดหมู่ ที่อยู่ โทรศัพท์ เวลาเปิด และรูปภาพพร้อมแล้ว", step3: "เข้าสู่ระบบและยืนยัน", step3body: "Google จะเป็นผู้กำหนดวิธียืนยัน เจ้าของร้านต้องดำเนินการเอง", search: "ค้นหาใน Google Maps", review: "ดูข้อมูลที่จะส่ง", note: "เราไม่สามารถรับประกันอันดับหรือข้ามขั้นตอนยืนยันของ Google ได้", profile: "แก้ไขข้อมูลร้าน" },
  en: { kicker: "GOOGLE MAPS", title: "Launch your store on Google Maps", body: "We prepare the information and guide each step. The owner must sign in and complete Google's verification.", status: "Waiting for owner verification", ready: "Listing data ready", step1: "Check for an existing listing", step1body: "See whether Google Maps already has a profile for this store.", step2: "Review your store details", step2body: "Name, category, address, phone, hours and photos are ready.", step3: "Sign in and verify", step3body: "Google chooses the verification method. The store owner completes this step.", search: "Search Google Maps", review: "Review listing data", note: "We cannot guarantee ranking or bypass Google's ownership verification.", profile: "Edit store profile" },
  zh: { kicker: "GOOGLE MAPS", title: "把店铺上线 Google Maps", body: "我们负责整理资料并引导每一步；Google登录和商家验证需要店主本人完成。", status: "等待店主完成验证", ready: "上线资料已经准备好", step1: "查询是否已有店铺条目", step1body: "先确认Google Maps中是否已经存在这家店。", step2: "确认准备提交的资料", step2body: "店名、分类、地址、电话、营业时间和照片已经整理完成。", step3: "登录Google并完成验证", step3body: "验证方式由Google决定，这一步必须由店主本人完成。", search: "在Google Maps中查询", review: "查看待提交资料", note: "我们不能保证搜索排名，也不能绕过Google的所有权验证。", profile: "修改店铺资料" },
};

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function GooglePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = ui[locale];
  return <MerchantRouteGate locale={locale}><>
    <Header locale={locale}/>
    <main className="app-main module-main">
      <section className="module-heading google-heading">
        <span className="module-big-icon"><Icon name="map" size={31}/></span>
        <p className="eyebrow">{t.kicker}</p><h1>{t.title}</h1><p>{t.body}</p>
        <span className="module-status waiting"><span/> {t.status}</span>
      </section>
      <MerchantSnapshot locale={locale} />
      <section className="step-list">
        <article className="step-card complete"><span className="step-number"><Icon name="check"/></span><div><h2>{t.step1}</h2><p>{t.step1body}</p><GoogleDraftSearchLink locale={locale} label={t.search} /></div></article>
        <article className="step-card complete"><span className="step-number"><Icon name="check"/></span><div><h2>{t.step2}</h2><p>{t.step2body}</p><Link href={`/${locale}/profile`}>{t.review}<Icon name="arrow" size={15}/></Link></div></article>
        <article className="step-card current"><span className="step-number">3</span><div><h2>{t.step3}</h2><p>{t.step3body}</p><button type="button" className="primary-button">Google Sign in · Mock</button></div></article>
      </section>
      <aside className="honest-note"><strong>i</strong><p>{t.note}</p><Link href={`/${locale}/profile`}>{t.profile}</Link></aside>
    </main>
    <Footer/>
  </></MerchantRouteGate>;
}
