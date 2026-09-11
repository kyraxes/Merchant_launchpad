import type { Metadata } from "next";
import { MerchantAdminDashboard } from "@/components/MerchantAdminDashboard";

export const metadata: Metadata = { title: "Merchant admin", robots: { index: false, follow: false } };

export default function AdminPage() { return <MerchantAdminDashboard/>; }
