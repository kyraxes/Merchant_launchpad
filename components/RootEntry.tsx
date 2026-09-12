"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function RootEntry() {
  const router = useRouter();
  useEffect(() => { router.replace("/th"); }, [router]);
  return <main className="launch-screen"><strong>Merchant Launchpad</strong><p>กำลังเปิดเว็บไซต์ · Opening website</p></main>;
}
