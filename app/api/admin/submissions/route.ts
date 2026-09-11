import { NextResponse } from "next/server";
import { adminErrorStatus, requireAdmin } from "@/lib/server/admin-auth";
import { listSubmissions } from "@/lib/server/submission-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const submissions = await listSubmissions();
    return NextResponse.json({ submissions }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ADMIN_ERROR" }, {
      status: adminErrorStatus(error),
      headers: { "cache-control": "no-store" },
    });
  }
}
