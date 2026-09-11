import { createHmac, timingSafeEqual } from "node:crypto";

export const adminSessionCookie = "merchant-admin-session";
const sessionPurpose = "merchant-launchpad-admin-v1";

function adminKey() {
  const key = process.env.ADMIN_API_KEY;
  if (!key) throw new Error("ADMIN_NOT_CONFIGURED");
  return key;
}

function equal(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminKey(received: string) {
  return equal(adminKey(), received);
}

export function createAdminSessionValue() {
  return createHmac("sha256", adminKey()).update(sessionPurpose).digest("hex");
}

export function verifyAdminSession(value: string | undefined) {
  return Boolean(value && equal(createAdminSessionValue(), value));
}

function requestCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

export function requireAdmin(request: Request) {
  const headerKey = request.headers.get("x-admin-key") || "";
  const cookieValue = requestCookie(request, adminSessionCookie);
  if ((headerKey && verifyAdminKey(headerKey)) || verifyAdminSession(cookieValue)) return;
  throw new Error("ADMIN_UNAUTHORIZED");
}

export function adminErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "ADMIN_ERROR";
  if (message === "ADMIN_NOT_CONFIGURED") return 503;
  if (message === "ADMIN_UNAUTHORIZED") return 401;
  if (message === "ORIGIN_NOT_ALLOWED") return 403;
  return 500;
}
