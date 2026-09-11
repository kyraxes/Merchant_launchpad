import { getStore } from "@netlify/blobs";
import type { MerchantSubmission } from "@/lib/submissions";

const storeName = "merchant-launchpad-submissions-v1";
const submissionPrefix = "submission/";

type MemoryStore = Map<string, unknown>;

function memoryStore() {
  const holder = globalThis as typeof globalThis & { __merchantSubmissionStore?: MemoryStore };
  if (!holder.__merchantSubmissionStore) holder.__merchantSubmissionStore = new Map();
  return holder.__merchantSubmissionStore;
}

function useMemoryStore() {
  return process.env.MERCHANT_STORAGE === "memory" || process.env.NODE_ENV !== "production";
}

export function submissionStorageBackend() {
  return useMemoryStore() ? "memory" as const : "netlify-blobs" as const;
}

export async function getSubmission(id: string) {
  const key = `${submissionPrefix}${id}`;
  if (useMemoryStore()) return (memoryStore().get(key) as MerchantSubmission | undefined) || null;
  const store = getStore({ name: storeName, consistency: "strong" });
  return await store.get(key, { type: "json" }) as MerchantSubmission | null;
}

export async function getSubmissionImage(id: string, kind: string) {
  const key = `image/${id}/${kind}`;
  if (useMemoryStore()) return (memoryStore().get(key) as string | undefined) || null;
  const store = getStore({ name: storeName, consistency: "strong" });
  return await store.get(key, { type: "text" });
}

export async function createSubmission(submission: MerchantSubmission, images: Record<string, string | null>) {
  const key = `${submissionPrefix}${submission.id}`;
  if (useMemoryStore()) {
    const memory = memoryStore();
    const existing = memory.get(key) as MerchantSubmission | undefined;
    if (existing) return { submission: existing, created: false };
    for (const [kind, image] of Object.entries(images)) if (image) memory.set(`image/${submission.id}/${kind}`, image);
    memory.set(key, submission);
    return { submission, created: true };
  }

  const store = getStore({ name: storeName, consistency: "strong" });
  const existing = await store.get(key, { type: "json" }) as MerchantSubmission | null;
  if (existing) return { submission: existing, created: false };
  const writtenImages: string[] = [];
  try {
    for (const [kind, image] of Object.entries(images)) {
      if (!image) continue;
      const imageKey = `image/${submission.id}/${kind}`;
      const result = await store.set(imageKey, image, { onlyIfNew: true, metadata: { submissionId: submission.id, kind } });
      if (result.modified) writtenImages.push(imageKey);
    }
    const result = await store.setJSON(key, submission, { onlyIfNew: true, metadata: { status: submission.status, submittedAt: submission.submittedAt } });
    if (!result.modified) {
      const duplicate = await store.get(key, { type: "json" }) as MerchantSubmission | null;
      if (duplicate) return { submission: duplicate, created: false };
      throw new Error("SUBMISSION_WRITE_CONFLICT");
    }
    return { submission, created: true };
  } catch (error) {
    await Promise.allSettled(writtenImages.map((imageKey) => store.delete(imageKey)));
    throw error;
  }
}

export async function listSubmissions() {
  if (useMemoryStore()) {
    return [...memoryStore().entries()]
      .filter(([key]) => key.startsWith(submissionPrefix))
      .map(([, value]) => value as MerchantSubmission)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
  const store = getStore({ name: storeName, consistency: "strong" });
  const { blobs } = await store.list({ prefix: submissionPrefix });
  const submissions = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json" }) as Promise<MerchantSubmission | null>));
  return submissions.filter((item): item is MerchantSubmission => Boolean(item)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function updateSubmission(submission: MerchantSubmission) {
  const key = `${submissionPrefix}${submission.id}`;
  if (useMemoryStore()) {
    memoryStore().set(key, submission);
    return;
  }
  const store = getStore({ name: storeName, consistency: "strong" });
  await store.setJSON(key, submission, { metadata: { status: submission.status, submittedAt: submission.submittedAt } });
}

export async function updateSubmissionImages(submission: MerchantSubmission, images: Record<string, string | null>) {
  const imageKeys = { ...submission.imageKeys };
  if (useMemoryStore()) {
    for (const [kind, image] of Object.entries(images)) {
      if (!image) continue;
      const imageKey = `image/${submission.id}/${kind}`;
      memoryStore().set(imageKey, image);
      imageKeys[kind as keyof typeof imageKeys] = imageKey;
    }
    return imageKeys;
  }
  const store = getStore({ name: storeName, consistency: "strong" });
  for (const [kind, image] of Object.entries(images)) {
    if (!image) continue;
    const imageKey = `image/${submission.id}/${kind}`;
    await store.set(imageKey, image, { metadata: { submissionId: submission.id, kind } });
    imageKeys[kind as keyof typeof imageKeys] = imageKey;
  }
  return imageKeys;
}

export async function deleteSubmission(submission: MerchantSubmission) {
  const keys = [
    `${submissionPrefix}${submission.id}`,
    ...Object.values(submission.imageKeys).filter((key): key is string => Boolean(key)),
  ];
  if (useMemoryStore()) {
    for (const key of keys) memoryStore().delete(key);
    return;
  }
  const store = getStore({ name: storeName, consistency: "strong" });
  await Promise.all(keys.map((key) => store.delete(key)));
}
