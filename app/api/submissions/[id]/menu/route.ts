import { verifyMerchantIdentity } from "@/lib/server/account-auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { getMenu, getSubmission, writeMenu } from "@/lib/server/submission-store";
import { canPublish, mockMenuRows, parseMenuImages, parseMenuRows } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

async function owner(request: Request, context: Context) {
  const identity = await verifyMerchantIdentity(request);
  const { id } = await context.params;
  if (!/^[a-f0-9]{24}$/.test(id)) throw new Error("NOT_FOUND");
  const merchant = await getSubmission(id);
  if (!merchant || merchant.ownerLineUserId !== identity.userId) throw new Error("NOT_FOUND");
  return merchant;
}

function failure(error: unknown) {
  if (error instanceof SyntaxError) return json({ error: "INVALID_MENU" }, 422);
  const code = error instanceof Error ? error.message : "MENU_FAILED";
  if (["LINE_TOKEN_REQUIRED", "INVALID_LINE_TOKEN"].includes(code)) return json({ error: code }, 401);
  if (code === "ORIGIN_NOT_ALLOWED") return json({ error: code }, 403);
  if (code === "NOT_FOUND") return json({ error: code }, 404);
  if (["MENU_CONFLICT", "MERCHANT_NOT_APPROVED"].includes(code)) return json({ error: code }, 409);
  if (code === "PAYLOAD_TOO_LARGE") return json({ error: code }, 413);
  if (["INVALID_MENU", "INVALID_IMAGES", "CONFIRM_MENU", "INVALID_ACTION"].includes(code)) return json({ error: code }, 422);
  console.error("Menu storage operation failed", error);
  return json({ error: "MENU_FAILED" }, 503);
}

async function readBody(request: Request) {
  const limit = 3_700_000;
  if (Number(request.headers.get("content-length")) > limit) throw new Error("PAYLOAD_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_MENU");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new Error("PAYLOAD_TOO_LARGE"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function GET(request: Request, context: Context) {
  try {
    const merchant = await owner(request, context);
    return json({ menu: await getMenu(merchant.id), approved: merchant.status === "approved" });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    requireSameOrigin(request);
    const merchant = await owner(request, context);
    const body = await readBody(request);
    if (!body || typeof body !== "object") throw new Error("INVALID_MENU");
    const current = await getMenu(merchant.id);
    if (!Number.isInteger(body.revision) || body.revision !== current.revision) throw new Error("MENU_CONFLICT");
    const next = { ...current, revision: current.revision + 1, updatedAt: new Date().toISOString() };
    if (body.action === "import") {
      next.images = parseMenuImages(body.images);
      next.rows = mockMenuRows();
      next.source = "mock";
    } else if (body.action === "save" || body.action === "publish") {
      next.rows = parseMenuRows(body.rows);
      if (body.action === "publish") {
        if (merchant.status !== "approved") throw new Error("MERCHANT_NOT_APPROVED");
        if (!canPublish(next.rows)) throw new Error("CONFIRM_MENU");
        next.published = { rows: structuredClone(next.rows), source: next.source, at: next.updatedAt, version: next.revision };
      }
    } else if (body.action === "unpublish") {
      next.published = null;
    } else throw new Error("INVALID_ACTION");
    await writeMenu(merchant.id, current.revision, next);
    return json({ menu: next, approved: merchant.status === "approved" });
  } catch (error) { return failure(error); }
}
