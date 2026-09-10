import type { Metadata } from "next";
import { MockAdminDashboard } from "@/components/MockAdminDashboard";

export const metadata: Metadata = { title: "Mock merchant admin", robots: { index: false, follow: false } };

export default function AdminPage() { return <MockAdminDashboard/>; }
