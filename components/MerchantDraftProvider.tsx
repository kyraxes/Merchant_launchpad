"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { merchants } from "@/data/merchants";
import { merchantToDraft, normalizeMerchantDraft, type MerchantDraft } from "@/lib/merchant-draft";

const legacyStorageKey = "merchant-launchpad-draft-v1";
const databaseName = "merchant-launchpad";
const storeName = "drafts";
const currentDraftKey = "current";
const fallbackDraft = merchantToDraft(merchants[0]);

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

async function readDeviceDraft() {
  const database = await openDatabase();
  return new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(currentDraftKey);
    request.onerror = () => reject(request.error || new Error("Unable to read device storage"));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
  });
}

async function writeDeviceDraft(draft: MerchantDraft) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(draft, currentDraftKey);
    transaction.onerror = () => reject(transaction.error || new Error("Unable to save on this device"));
    transaction.oncomplete = () => { database.close(); resolve(); };
  });
}

async function deleteDeviceDraft() {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(currentDraftKey);
    transaction.onerror = () => reject(transaction.error || new Error("Unable to reset device storage"));
    transaction.oncomplete = () => { database.close(); resolve(); };
  });
}

type MerchantDraftContextValue = {
  draft: MerchantDraft;
  hydrated: boolean;
  saveDraft: (next: MerchantDraft) => Promise<void>;
  resetDraft: () => Promise<void>;
};

const MerchantDraftContext = createContext<MerchantDraftContextValue | null>(null);

export function MerchantDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState(fallbackDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        let saved = await readDeviceDraft();
        if (!saved) {
          const legacy = window.localStorage.getItem(legacyStorageKey);
          if (legacy) {
            saved = JSON.parse(legacy);
            await writeDeviceDraft(normalizeMerchantDraft(saved, fallbackDraft));
            window.localStorage.removeItem(legacyStorageKey);
          }
        }
        if (saved && active) setDraft(normalizeMerchantDraft(saved, fallbackDraft));
      } catch {
        try {
          const legacy = window.localStorage.getItem(legacyStorageKey);
          if (legacy && active) setDraft(normalizeMerchantDraft(JSON.parse(legacy), fallbackDraft));
        } catch { /* Start with mock data if device storage is unavailable. */ }
      } finally {
        if (active) setHydrated(true);
      }
    }
    void hydrate();
    return () => { active = false; };
  }, []);

  const value = useMemo<MerchantDraftContextValue>(() => ({
    draft,
    hydrated,
    saveDraft: async (next) => {
      const saved = { ...normalizeMerchantDraft(next, fallbackDraft), updatedAt: new Date().toISOString() };
      await writeDeviceDraft(saved);
      window.localStorage.removeItem(legacyStorageKey);
      setDraft(saved);
    },
    resetDraft: async () => {
      await deleteDeviceDraft();
      window.localStorage.removeItem(legacyStorageKey);
      setDraft(fallbackDraft);
    },
  }), [draft, hydrated]);

  return <MerchantDraftContext.Provider value={value}>{children}</MerchantDraftContext.Provider>;
}

export function useMerchantDraft() {
  const context = useContext(MerchantDraftContext);
  if (!context) throw new Error("useMerchantDraft must be used inside MerchantDraftProvider");
  return context;
}
