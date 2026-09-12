import { NextResponse } from "next/server";
import { accountCookie, authenticate, createSession, getAccount, normalizeUsername, rateLimit, requireBrowserOrigin, revokeSession, sessionAge } from "@/lib/server/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "cache-control": "no-store" };
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "ACCOUNT_ERROR";
  const statuses: Record<string, number> = { INVALID_ACCOUNT: 422, ACCOUNT_EXISTS: 409, INVALID_CREDENTIALS: 401, RATE_LIMITED: 429, ORIGIN_NOT_ALLOWED: 403 };
  return NextResponse.json({ error: statuses[code] ? code : "ACCOUNT_ERROR" }, { status: statuses[code] || 503, headers });
}
export async function GET(request: Request) {
  try {
    const account = await getAccount(request);
    return NextResponse.json({ user: account ? { id: account.id, username: account.username } : null }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    requireBrowserOrigin(request);
    // Netlify supplies the connection IP. Else use a conservative shared local bucket.
    await rateLimit(`ip:${process.env.NETLIFY === "true" ? request.headers.get("x-nf-client-connection-ip") || "unknown" : "local"}`, 100);
    const reader = request.body?.getReader();
    if (!reader) throw new Error("INVALID_ACCOUNT");
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 2048) { await reader.cancel(); throw new Error("INVALID_ACCOUNT"); } chunks.push(value); } } finally { reader.releaseLock(); }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || !["login", "register"].includes(body.action)) throw new Error("INVALID_ACCOUNT");
    const account = await authenticate(normalizeUsername(body.username), body.password, body.action === "register");
    await revokeSession(request);
    const secret = await createSession(account);
    const response = NextResponse.json({ user: { id: account.id, username: account.username } }, { headers });
    response.cookies.set({ name: accountCookie, value: secret, httpOnly: true, secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https", sameSite: "strict", path: "/", maxAge: sessionAge });
    return response;
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    requireBrowserOrigin(request); await revokeSession(request);
    const response = NextResponse.json({ user: null }, { headers });
    response.cookies.set({ name: accountCookie, value: "", httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) { return failure(error); }
}
