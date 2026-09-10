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
  const normalized = source.merchants.map((item, index) => normalizeMerchantDraft(item, seedDrafts[index] || seedDrafts[0]));
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
  setFailNextRequest: (value: boolean) => void;
  saveDraft: (next: MerchantDraft) => Promise<void>;
  resetDraft: () => Promise<void>;
  createMerchant: (locale: Locale) => Promise<string>;
  selectMerchant: (id: string) => Promise<void>;
  setMerchantStatus: (id: string, status: MerchantWorkflowStatus) => Promise<void>;
  deleteMerchant: (id: string) => Promise<void>;
};

const MerchantDraftContext = createContext<MerchantDraftContextValue | null>(null);

export function MerchantDraftProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState(seedWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [failNextRequest, setFailNextRequestState] = useState(false);
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
          await writeRecord(workspaceKey, loaded);
          window.localStorage.removeItem(legacyStorageKey);
        }
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
    setFailNextRequest,
    saveDraft: async (draft) => commit((current) => {
      const saved = { ...normalizeMerchantDraft(draft, current.merchants[0]), updatedAt: new Date().toISOString() };
      return { ...current, merchants: current.merchants.map((item) => item.id === saved.id ? saved : item), events: [addEvent(saved.id, "saved"), ...current.events].slice(0, 100) };
    }),
    resetDraft: async () => commit((current) => {
      const selected = current.merchants.find((item) => item.id === current.selectedId) || current.merchants[0];
      const fallback = seedDrafts.find((item) => item.id === selected.id) || createEmptyMerchantDraft(selected.id, "th");
      return { ...current, merchants: current.merchants.map((item) => item.id === selected.id ? fallback : item) };
    }),
    createMerchant: async (locale) => {
      const id = makeId("merchant");
      const created = createEmptyMerchantDraft(id, locale);
      await commit((current) => ({ ...current, selectedId: id, merchants: [created, ...current.merchants], events: [addEvent(id, "created"), ...current.events].slice(0, 100) }));
      return id;
    },
    selectMerchant: async (id) => commit((current) => current.merchants.some((item) => item.id === id) ? { ...current, selectedId: id, events: [addEvent(id, "selected"), ...current.events].slice(0, 100) } : current),
    setMerchantStatus: async (id, status) => commit((current) => {
      const eventType: MerchantEventType = status === "review" ? "submitted" : status === "published" ? "published" : "unpublished";
      return { ...current, merchants: current.merchants.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item), events: [addEvent(id, eventType), ...current.events].slice(0, 100) };
    }),
    deleteMerchant: async (id) => commit((current) => {
      if (current.merchants.length <= 1) throw new Error("LAST_MERCHANT");
      const remaining = current.merchants.filter((item) => item.id !== id);
      return { ...current, selectedId: current.selectedId === id ? remaining[0].id : current.selectedId, merchants: remaining, events: current.events.filter((event) => event.merchantId !== id) };
    }),
  }), [commit, failNextRequest, hydrated, setFailNextRequest, workspace]);

  return <MerchantDraftContext.Provider value={value}>{children}</MerchantDraftContext.Provider>;
}

export function useMerchantDraft() {
  const context = useContext(MerchantDraftContext);
  if (!context) throw new Error("useMerchantDraft must be used inside MerchantDraftProvider");
  return context;
}
