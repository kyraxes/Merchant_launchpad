import { NextResponse } from "next/server";
import {
  adminErrorStatus,
  adminSessionCookie,
  createAdminSessionValue,
  verifyAdminKey,
} from "@/lib/server/admin-auth";
import { requireSameOrigin } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await request.json() as { adminKey?: unknown };
    const key = typeof body.adminKey === "string" ? body.adminKey : "";
    if (!verifyAdminKey(key)) throw new Error("ADMIN_UNAUTHORIZED");

    const response = NextResponse.json({ authenticated: true }, { headers: { "cache-control": "no-store" } });
    response.cookies.set({
      name: adminSessionCookie,
      value: createAdminSessionValue(),
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
      priority: "high",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ADMIN_ERROR" }, {
      status: adminErrorStatus(error),
      headers: { "cache-control": "no-store" },
    });
  }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const response = NextResponse.json({ authenticated: false }, { headers: { "cache-control": "no-store" } });
    response.cookies.set({ name: adminSessionCookie, value: "", httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ADMIN_ERROR" }, {
      status: adminErrorStatus(error),
      headers: { "cache-control": "no-store" },
    });
  }
}
