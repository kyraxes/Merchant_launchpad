"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/components/LiffProvider";

export function RootEntry() {
  const router = useRouter();
  const { status } = useLiff();

  useEffect(() => {
    if (status !== "loading") router.replace("/th");
  }, [router, status]);

  return (
    <main className="launch-screen">
      <span className="launch-mark">M</span>
      <strong>Merchant Launchpad</strong>
      <p>กำลังเปิดใน LINE · Opening in LINE</p>
    </main>
  );
}
