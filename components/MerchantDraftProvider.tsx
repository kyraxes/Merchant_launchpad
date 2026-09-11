"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { merchants as fixtureMerchants } from "@/data/merchants";
import {
  createEmptyMerchantDraft,
  merchantToDraft,
  normalizeMerchantDraft,
  type MerchantDraft,
  type MerchantEvent,
  type MerchantEventType,
  type MerchantWorkflowStatus,
  type MerchantWorkspace,
} from "@/lib/merchant-draft";
import type { Locale } from "@/lib/types";
import type { PublicMerchantSubmission } from "@/lib/submissions";
import { useLiff } from "@/components/LiffProvider";

const legacyStorageKey = "merchant-launchpad-draft-v1";
const databaseName = "merchant-launchpad";
const storeName = "drafts";
const legacyDraftKey = "current";
const workspaceKey = "workspace-v2";

const seedDrafts = fixtureMerchants.slice(0, 3).map(merchantToDraft);
seedDrafts[0] = {
  ...seedDrafts[0],
  images: {
    storefront: "/test-data/mock-storefront.png",
    menu: "/test-data/mock-menu.png",
    product: "/test-data/mock-product.png",
  },
};
const seedWorkspace: MerchantWorkspace = { version: 2, selectedId: seedDrafts[0].id, merchants: seedDrafts, events: [] };

function submissionToDraft(submission: PublicMerchantSubmission): MerchantDraft {
  const draft = createEmptyMerchantDraft(submission.id, submission.locale);
  const localized = (value: string) => ({ th: "", en: "", zh: "", [submission.locale]: value });
  return {
    ...draft,
    id: submission.id,
    slug: submission.id,
    status: submission.status === "approved" ? "published" : submission.status,
    name: localized(submission.name),
    category: localized(submission.category),
    address: localized(submission.address),
    phone: submission.phone,
    lineId: submission.lineId,
    hours: submission.hours,
    createdAt: submission.submittedAt,
    updatedAt: submission.updatedAt,
  };
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);
    request.onerror = () => reject(request.error || new Error("Unable to open device storage"));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readRecord(key: string) {
  const database = await openDatabase();
  return new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);
    request.onerror = () => reject(request.error || new Error("Unable to read device storage"));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
  });
}

async function writeRecord(key: string, value: unknown) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value, key);
    transaction.onerror = () => reject(transaction.error || new Error("Unable to save on this device"));
    transaction.oncomplete = () => { database.close(); resolve(); };
  });
}

function normalizeWorkspace(value: unknown): MerchantWorkspace | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<MerchantWorkspace>;
  if (!Array.isArray(source.merchants) || !source.merchants.length) return null;
  const normalized = source.merchants
    .map((item, index) => normalizeMerchantDraft(item, seedDrafts[index] || seedDrafts[0]))
    .filter((item) => !(
      item.id.startsWith("merchant-")
      && item.status === "draft"
      && ["新店铺", "ร้านใหม่", "New store"].includes(item.name.zh || item.name.th || item.name.en)
      && !item.address.zh && !item.address.th && !item.address.en
      && !item.phone && !item.hours
      && !item.images.storefront && !item.images.menu && !item.images.product
    ));
  if (!normalized.length) return seedWorkspace;
  const selectedId = normalized.some((item) => item.id === source.selectedId) ? String(source.selectedId) : normalized[0].id;
  return { version: 2, selectedId, merchants: normalized, events: Array.isArray(source.events) ? source.events : [] };
}

const waitForMockServer = () => new Promise((resolve) => window.setTimeout(resolve, 420));
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

type MerchantDraftContextValue = {
  draft: MerchantDraft;
  merchants: MerchantDraft[];
  events: MerchantEvent[];
  hydrated: boolean;
  failNextRequest: boolean;
  syncState: "idle" | "syncing" | "synced" | "error";
  setFailNextRequest: (value: boolean) => void;
  syncServer: () => Promise<void>;
  saveDraft: (next: MerchantDraft) => Promise<void>;
  resetDraft: () => Promise<void>;
  submitMerchant: (next: MerchantDraft, locale: Locale, idToken: string) => Promise<string>;
  selectMerchant: (id: string) => Promise<void>;
  setMerchantStatus: (id: string, status: MerchantWorkflowStatus) => Promise<void>;
  deleteMerchant: (id: string) => Promise<void>;
};

const MerchantDraftContext = createContext<MerchantDraftContextValue | null>(null);

export function MerchantDraftProvider({ children }: { children: React.ReactNode }) {
  const { status: lineStatus, isInClient, isLoggedIn, idToken } = useLiff();
  const [workspace, setWorkspace] = useState(seedWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [failNextRequest, setFailNextRequestState] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const workspaceRef = useRef(seedWorkspace);
  const failNextRef = useRef(false);

  const updateWorkspace = useCallback((next: MerchantWorkspace) => {
    workspaceRef.current = next;
    setWorkspace(next);
  }, []);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        let loaded = normalizeWorkspace(await readRecord(workspaceKey));
        if (!loaded) {
          const legacyDevice = await readRecord(legacyDraftKey);
          const legacyBrowser = window.localStorage.getItem(legacyStorageKey);
          const legacy = legacyDevice || (legacyBrowser ? JSON.parse(legacyBrowser) : null);
          if (legacy) {
            const migrated = normalizeMerchantDraft(legacy, seedDrafts[0]);
            loaded = { ...seedWorkspace, selectedId: migrated.id, merchants: [migrated, ...seedDrafts.slice(1)] };
          } else loaded = seedWorkspace;
          window.localStorage.removeItem(legacyStorageKey);
        }
        await writeRecord(workspaceKey, loaded);
        if (active) updateWorkspace(loaded);
      } catch {
        if (active) updateWorkspace(seedWorkspace);
      } finally {
        if (active) setHydrated(true);
      }
    }
    void hydrate();
    return () => { active = false; };
  }, [updateWorkspace]);

  const syncServer = useCallback(async () => {
    if (!hydrated || lineStatus !== "ready" || !isInClient || !isLoggedIn || !idToken) return;
    setSyncState("syncing");
    try {
      const response = await fetch("/api/submissions", {
        headers: { authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      const payload = await response.json() as { submissions?: PublicMerchantSubmission[] };
      if (!response.ok || !payload.submissions) throw new Error("SYNC_FAILED");
      const current = workspaceRef.current;
      const serverById = new Map(payload.submissions.map((item) => [item.id, item]));
      const mergedLocal = current.merchants.map((merchant) => {
        const server = serverById.get(merchant.id);
        if (!server) return merchant;
        serverById.delete(merchant.id);
        return {
          ...merchant,
          slug: server.id,
          status: server.status === "approved" ? "published" as const : server.status,
          updatedAt: server.updatedAt,
        };
      });
      const serverOnly = [...serverById.values()].map(submissionToDraft);
      const next = { ...current, merchants: [...serverOnly, ...mergedLocal] };
      await writeRecord(workspaceKey, next);
      updateWorkspace(next);
      setSyncState("synced");
    } catch {
      setSyncState("error");
      throw new Error("SYNC_FAILED");
    }
  }, [hydrated, idToken, isInClient, isLoggedIn, lineStatus, updateWorkspace]);

  useEffect(() => {
    if (!hydrated || lineStatus !== "ready" || !isInClient || !isLoggedIn || !idToken) return;
    void syncServer().catch(() => undefined);
    const refreshOnFocus = () => { if (document.visibilityState === "visible") void syncServer().catch(() => undefined); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => document.removeEventListener("visibilitychange", refreshOnFocus);
  }, [hydrated, idToken, isInClient, isLoggedIn, lineStatus, syncServer]);

  const setFailNextRequest = useCallback((value: boolean) => {
    failNextRef.current = value;
    setFailNextRequestState(value);
  }, []);

  const commit = useCallback(async (transform: (current: MerchantWorkspace) => MerchantWorkspace) => {
    await waitForMockServer();
    if (failNextRef.current) {
      setFailNextRequest(false);
      throw new Error("MOCK_REQUEST_FAILED");
    }
    const next = transform(workspaceRef.current);
    await writeRecord(workspaceKey, next);
    updateWorkspace(next);
  }, [setFailNextRequest, updateWorkspace]);

  const addEvent = (merchantId: string, type: MerchantEventType): MerchantEvent => ({ id: makeId("event"), merchantId, type, at: new Date().toISOString() });

  const value = useMemo<MerchantDraftContextValue>(() => ({
    draft: workspace.merchants.find((item) => item.id === workspace.selectedId) || workspace.merchants[0],
    merchants: workspace.merchants,
    events: workspace.events,
    hydrated,
    failNextRequest,
    syncState,
    setFailNextRequest,
    syncServer,
    saveDraft: async (draft) => commit((current) => {
      const saved = { ...normalizeMerchantDraft(draft, current.merchants[0]), updatedAt: new Date().toISOString() };
      return { ...current, merchants: current.merchants.map((item) => item.id === saved.id ? saved : item), events: [addEvent(saved.id, "saved"), ...current.events].slice(0, 100) };
    }),
    resetDraft: async () => commit((current) => {
      const selected = current.merchants.find((item) => item.id === current.selectedId) || current.merchants[0];
      const fallback = seedDrafts.find((item) => item.id === selected.id) || createEmptyMerchantDraft(selected.id, "th");
      return { ...current, merchants: current.merchants.map((item) => item.id === selected.id ? fallback : item) };
    }),
    submitMerchant: async (draft, locale, idToken) => {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          clientSubmissionId: draft.id,
          locale,
          name: draft.name[locale],
          category: draft.category[locale],
          address: draft.address[locale],
          phone: draft.phone,
          hours: draft.hours,
          lineId: draft.lineId,
          images: draft.images,
        }),
      });
      const payload = await response.json() as { submission?: PublicMerchantSubmission; error?: string };
      if (!response.ok || !payload.submission) throw new Error(payload.error || "SUBMISSION_FAILED");
      const id = payload.submission.id;
      const timestamp = new Date().toISOString();
      const submitted = {
        ...normalizeMerchantDraft(draft, createEmptyMerchantDraft(id, "th")),
        id,
        slug: id,
        status: payload.submission.status === "approved" ? "published" as const : payload.submission.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const current = workspaceRef.current;
      const alreadySynced = current.merchants.some((item) => item.id === id);
      const next = {
        ...current,
        selectedId: id,
        merchants: [submitted, ...current.merchants.filter((item) => item.id !== id && item.id !== draft.id)],
        events: alreadySynced ? current.events : [addEvent(id, "submitted"), addEvent(id, "created"), ...current.events].slice(0, 100),
      };
      await writeRecord(workspaceKey, next);
      updateWorkspace(next);
      return id;
    },
    selectMerchant: async (id) => commit((current) => current.merchants.some((item) => item.id === id) ? { ...current, selectedId: id, events: [addEvent(id, "selected"), ...current.events].slice(0, 100) } : current),
    setMerchantStatus: async (id, status) => commit((current) => {
      const eventType: MerchantEventType = status === "review" ? "submitted" : status === "published" ? "published" : "unpublished";
      return { ...current, merchants: current.merchants.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item), events: [addEvent(id, eventType), ...current.events].slice(0, 100) };
    }),
    deleteMerchant: async (id) => {
      if (/^[a-f0-9]{24}$/.test(id) && idToken) {
        const response = await fetch(`/api/submissions/${id}`, { method: "DELETE", headers: { authorization: `Bearer ${idToken}` } });
        if (!response.ok) {
          const payload = await response.json() as { error?: string };
          throw new Error(payload.error || "DELETE_FAILED");
        }
      }
      await commit((current) => {
      if (current.merchants.length <= 1) throw new Error("LAST_MERCHANT");
      const remaining = current.merchants.filter((item) => item.id !== id);
      return { ...current, selectedId: current.selectedId === id ? remaining[0].id : current.selectedId, merchants: remaining, events: current.events.filter((event) => event.merchantId !== id) };
      });
    },
  }), [commit, failNextRequest, hydrated, idToken, setFailNextRequest, syncServer, syncState, updateWorkspace, workspace]);

  return <MerchantDraftContext.Provider value={value}>{children}</MerchantDraftContext.Provider>;
}

export function useMerchantDraft() {
  const context = useContext(MerchantDraftContext);
  if (!context) throw new Error("useMerchantDraft must be used inside MerchantDraftProvider");
  return context;
}
