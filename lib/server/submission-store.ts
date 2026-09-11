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

function useNetlifyStore() {
  return process.env.NETLIFY === "true" || Boolean(process.env.NETLIFY_SITE_ID);
}

export async function getSubmission(id: string) {
  const key = `${submissionPrefix}${id}`;
  if (!useNetlifyStore()) return (memoryStore().get(key) as MerchantSubmission | undefined) || null;
  const store = getStore({ name: storeName, consistency: "strong" });
  return await store.get(key, { type: "json" }) as MerchantSubmission | null;
}

export async function createSubmission(submission: MerchantSubmission, images: Record<string, string | null>) {
  const key = `${submissionPrefix}${submission.id}`;
  if (!useNetlifyStore()) {
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
  if (!useNetlifyStore()) {
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
  if (!useNetlifyStore()) {
    memoryStore().set(key, submission);
    return;
  }
  const store = getStore({ name: storeName, consistency: "strong" });
  await store.setJSON(key, submission, { metadata: { status: submission.status, submittedAt: submission.submittedAt } });
}
