"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { merchants } from "@/data/merchants";
import { merchantToDraft, normalizeMerchantDraft, type MerchantDraft } from "@/lib/merchant-draft";

const storageKey = "merchant-launchpad-draft-v1";
const fallbackDraft = merchantToDraft(merchants[0]);

type MerchantDraftContextValue = {
  draft: MerchantDraft;
  hydrated: boolean;
  saveDraft: (next: MerchantDraft) => void;
  resetDraft: () => void;
};

const MerchantDraftContext = createContext<MerchantDraftContextValue | null>(null);

export function MerchantDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState(fallbackDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setDraft(normalizeMerchantDraft(JSON.parse(saved), fallbackDraft));
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);

  const value = useMemo<MerchantDraftContextValue>(() => ({
    draft,
    hydrated,
    saveDraft: (next) => {
      const saved = { ...normalizeMerchantDraft(next, fallbackDraft), updatedAt: new Date().toISOString() };
      setDraft(saved);
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
    },
    resetDraft: () => {
      setDraft(fallbackDraft);
      window.localStorage.removeItem(storageKey);
    },
  }), [draft, hydrated]);

  return <MerchantDraftContext.Provider value={value}>{children}</MerchantDraftContext.Provider>;
}

export function useMerchantDraft() {
  const context = useContext(MerchantDraftContext);
  if (!context) throw new Error("useMerchantDraft must be used inside MerchantDraftProvider");
  return context;
}
