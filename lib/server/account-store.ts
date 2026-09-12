import { getStore } from "@netlify/blobs";

type Entry = { value: unknown; etag: string };
function memory() {
  const g = globalThis as typeof globalThis & { accountMemory?: Map<string, Entry> };
  return g.accountMemory ||= new Map();
}
const store = () => getStore({ name: "merchant-launchpad-accounts-v1", consistency: "strong" });
export async function readAccountData<T>(key: string): Promise<{ value: T; etag: string } | null> {
  if (process.env.MERCHANT_STORAGE === "memory") {
    const entry = memory().get(key); return entry ? structuredClone(entry) as { value: T; etag: string } : null;
  }
  const entry = await store().getWithMetadata(key, { type: "json" });
  if (entry && !entry.etag) throw new Error("ACCOUNT_STORE_VERSION_MISSING");
  return entry ? { value: entry.data as T, etag: entry.etag! } : null;
}
export async function putAccountData(key: string, value: unknown, etag: string | null) {
  if (process.env.MERCHANT_STORAGE === "memory") {
    const current = memory().get(key);
    if ((current?.etag || null) !== etag) return false;
    memory().set(key, { value: structuredClone(value), etag: crypto.randomUUID() }); return true;
  }
  const result = await store().setJSON(key, value, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
  return result.modified;
}
export async function deleteAccountData(key: string) {
  if (process.env.MERCHANT_STORAGE === "memory") { memory().delete(key); return; }
  await store().delete(key);
}
