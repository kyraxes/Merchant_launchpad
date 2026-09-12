import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { readAccountData, putAccountData, deleteAccountData } from "@/lib/server/account-store";
import { requireSameOrigin } from "@/lib/server/request-security";
import { verifyLineIdToken } from "@/lib/server/line-auth";

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
});
export const accountCookie = "merchant-session";
export const sessionAge = 60 * 60 * 24 * 14;
export type Account = { id: string; username: string; salt: string; passwordHash: string; ownerId: string; createdAt: string };
type Session = { accountKey: string; expiresAt: number };
export const digest = (s: string) => createHash("sha256").update(s).digest("hex");
export const accountKey = (username: string) => `account/${digest(username.toLowerCase())}`;
export function normalizeUsername(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,40}$/.test(value)) throw new Error("INVALID_ACCOUNT");
  return value.toLowerCase();
}
export function requireBrowserOrigin(request: Request) {
  if (!request.headers.get("origin") || request.headers.get("sec-fetch-site") === "cross-site") throw new Error("ORIGIN_NOT_ALLOWED");
  requireSameOrigin(request);
}
function token(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(`${accountCookie}=`))?.slice(accountCookie.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function getAccount(request: Request) {
  const secret = token(request);
  if (!secret) return null;
  const session = await readAccountData<Session>(`session/${digest(secret)}`);
  if (!session || session.value.expiresAt <= Date.now()) return null;
  return (await readAccountData<Account>(session.value.accountKey))?.value || null;
}
export async function createSession(account: Account) {
  const secret = randomBytes(32).toString("hex");
  if (!await putAccountData(`session/${digest(secret)}`, { accountKey: accountKey(account.username), expiresAt: Date.now() + sessionAge * 1000 }, null)) throw new Error("SESSION_WRITE_FAILED");
  return secret;
}
export async function revokeSession(request: Request) {
  const secret = token(request);
  if (secret) await deleteAccountData(`session/${digest(secret)}`);
}
export async function rateLimit(key: string, maximum = 12) {
  const bucket = `attempt/${digest(key)}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const entry = await readAccountData<{ count: number; until: number }>(bucket);
    const value = entry && entry.value.until > Date.now() ? entry.value : { count: 0, until: Date.now() + 15 * 60_000 };
    if (value.count >= maximum) throw new Error("RATE_LIMITED");
    if (await putAccountData(bucket, { ...value, count: value.count + 1 }, entry?.etag || null)) return;
  }
  throw new Error("RATE_LIMITED");
}
export async function authenticate(username: string, password: string, register: boolean) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) throw new Error("INVALID_ACCOUNT");
  const key = accountKey(username);
  await rateLimit(key);
  const existing = await readAccountData<Account>(key);
  const salt = existing?.value.salt || randomBytes(16).toString("hex");
  const hash = await derive(password, salt);
  if (register) {
    if (existing) throw new Error("ACCOUNT_EXISTS");
    const id = `web-${crypto.randomUUID()}`;
    const account: Account = { id, ownerId: id, username, salt, passwordHash: hash.toString("hex"), createdAt: new Date().toISOString() };
    if (!await putAccountData(key, account, null)) throw new Error("ACCOUNT_EXISTS");
    return account;
  }
  if (!existing || !timingSafeEqual(hash, Buffer.from(existing.value.passwordHash, "hex"))) throw new Error("INVALID_CREDENTIALS");
  return existing.value;
}
export async function verifyMerchantIdentity(request: Request) {
  const account = await getAccount(request);
  if (account) {
    if (!["GET", "HEAD"].includes(request.method)) requireBrowserOrigin(request);
    return { userId: account.ownerId, displayName: account.username };
  }
  // Keep authenticated legacy API clients compatible; the website never loads LIFF.
  return verifyLineIdToken(request.headers.get("authorization"));
}

// Immutable reservation prevents new business creation racing a legacy migration.
export async function reserveAccountOwner(id: string, ownerId: string) {
  const key = `ownership/${id}`;
  const existing = await readAccountData<{ ownerId: string }>(key);
  if (existing) { if (existing.value.ownerId !== ownerId) throw new Error("OWNER_MERCHANT_EXISTS"); return; }
  if (!await putAccountData(key, { ownerId }, null)) {
    const current = await readAccountData<{ ownerId: string }>(key);
    if (current?.value.ownerId !== ownerId) throw new Error("OWNER_MERCHANT_EXISTS");
  }
}
