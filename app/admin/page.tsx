import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MerchantAdminDashboard } from "@/components/MerchantAdminDashboard";
import { adminSessionCookie, verifyAdminSession } from "@/lib/server/admin-auth";

export const metadata: Metadata = { title: "Merchant admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(adminSessionCookie)?.value)) redirect("/admin/login");
  return <MerchantAdminDashboard/>;
}
