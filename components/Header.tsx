import Link from "next/link";
import type { Locale } from "@/lib/types";
import { copy } from "@/lib/i18n";
import { Icon } from "@/components/Icon";

export function Header({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale];
  return (
    <>
      <header className="app-header">
        <Link className="app-brand" href={`/${locale}`}>
          <span className="app-brand-mark"><Icon name="sparkles" size={17} /></span>
          <span><strong>{t.brand}</strong><small>LINE LIFF App · Mock V1</small></span>
        </Link>
        <div className="header-actions">
          <Link className="demo-pill" href="/launch">LINE</Link>
          <span className="language-switcher">
            <Link className={locale === "zh" ? "active" : ""} href="/zh">中</Link>
            <Link className={locale === "th" ? "active" : ""} href="/th">ไทย</Link>
            <Link className={locale === "en" ? "active" : ""} href="/en">EN</Link>
          </span>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Primary navigation">
        <Link href={`/${locale}`}><Icon name="home"/><span>{t.dashboard}</span></Link>
        <Link href={`/${locale}/google`}><Icon name="map"/><span>Google</span></Link>
        <Link href={`/${locale}/website`}><Icon name="globe"/><span>{t.website}</span></Link>
        <Link href={`/${locale}/posters`}><Icon name="poster"/><span>{t.posters}</span></Link>
      </nav>
    </>
  );
}
