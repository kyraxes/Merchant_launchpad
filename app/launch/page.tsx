import type { Metadata } from "next";
import { LaunchAccess } from "@/components/LaunchAccess";

export const metadata: Metadata = {
  title: "Open in LINE",
  robots: { index: false, follow: false },
};

export default function LaunchPage() {
  return <LaunchAccess />;
}
