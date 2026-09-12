"use client";
import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import { accountCopy } from "@/components/AccountForm";
import type { Locale } from "@/lib/types";
export function AccountStatus({ locale }: { locale: Locale }) {
  const { user, status, logout, refresh } = useAccount(); const t = accountCopy[locale];
  return <section className="account-status"><div><strong>{user ? `${t.logged} · ${user.username}` : t.intro}</strong></div>{status === "error" ? <button onClick={() => void refresh()}>{t.retry}</button> : user ? <button onClick={() => void logout().then(() => window.location.assign(`/${locale}`)).catch(() => window.alert(t.error))}>{t.logout}</button> : <Link className="primary-button" href={`/${locale}/login`}>{t.login} / {t.register}</Link>}</section>;
}
