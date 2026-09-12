import { requireAdmin } from "@/lib/server/admin-auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { accountKey, digest, normalizeUsername, reserveAccountOwner, type Account } from "@/lib/server/account-auth";
import { putAccountData, readAccountData } from "@/lib/server/account-store";
import { getSubmission, listSubmissions } from "@/lib/server/submission-store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); requireAdmin(request);
    const body = await request.json();
    const username = normalizeUsername(body.username);
    if (typeof body.merchantId !== "string" || !/^[a-f0-9]{24}$/.test(body.merchantId)) throw new Error("INVALID_ACCOUNT");
    const merchant = await getSubmission(body.merchantId);
    const entry = await readAccountData<Account>(accountKey(username));
    if (!merchant || !entry) throw new Error("NOT_FOUND");
    if (merchant.ownerLineUserId.startsWith("web-")) throw new Error("NOT_LEGACY_OWNER");
    const account = entry.value;
    if (account.ownerId !== account.id && account.ownerId !== merchant.ownerLineUserId) throw new Error("ACCOUNT_ALREADY_LINKED");
    if ((await listSubmissions()).some(item => item.ownerLineUserId === account.id)) throw new Error("ACCOUNT_HAS_MERCHANT");
    const reverseKey = `legacy/${digest(merchant.ownerLineUserId)}`;
    const reverse = await readAccountData<{ accountId: string }>(reverseKey);
    if (reverse && reverse.value.accountId !== account.id) throw new Error("OWNER_ALREADY_LINKED");
    await reserveAccountOwner(account.id, merchant.ownerLineUserId);
    if (!reverse && !await putAccountData(reverseKey, { accountId: account.id }, null)) {
      const again = await readAccountData<{ accountId: string }>(reverseKey);
      if (again?.value.accountId !== account.id) throw new Error("OWNER_ALREADY_LINKED");
    }
    if (!await putAccountData(accountKey(username), { ...account, ownerId: merchant.ownerLineUserId }, entry.etag)) throw new Error("ACCOUNT_CONFLICT");
    return Response.json({ linked: true, username }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ACCOUNT_ERROR";
    const known = ["NOT_FOUND", "INVALID_ACCOUNT", "NOT_LEGACY_OWNER", "ACCOUNT_ALREADY_LINKED", "ACCOUNT_HAS_MERCHANT", "OWNER_ALREADY_LINKED", "OWNER_MERCHANT_EXISTS", "ACCOUNT_CONFLICT"];
    const status = code === "ADMIN_UNAUTHORIZED" ? 401 : code === "ORIGIN_NOT_ALLOWED" ? 403 : known.includes(code) ? 409 : 503;
    return Response.json({ error: status === 503 ? "ACCOUNT_ERROR" : code }, { status, headers: { "cache-control": "no-store" } });
  }
}
