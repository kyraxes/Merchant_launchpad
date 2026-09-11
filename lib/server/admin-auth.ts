import { timingSafeEqual } from "node:crypto";

export function requireAdmin(request: Request) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) throw new Error("ADMIN_NOT_CONFIGURED");
  const received = request.headers.get("x-admin-key") || "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }
}

export function adminErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "ADMIN_ERROR";
  if (message === "ADMIN_NOT_CONFIGURED") return 503;
  if (message === "ADMIN_UNAUTHORIZED") return 401;
  return 500;
}
