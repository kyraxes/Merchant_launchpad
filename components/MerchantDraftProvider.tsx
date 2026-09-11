"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyMerchantDraft,
  type MerchantDraft,
  type MerchantWorkspace,
} from "@/lib/merchant-draft";
import type { Locale } from "@/lib/types";
import type { PublicMerchantSubmission } from "@/lib/submissions";
import { useLiff } from "@/components/LiffProvider";

const emptyWorkspace: MerchantWorkspace = { version: 2, selectedId: "", merchants: [], events: [] };

function submissionToDraft(submission: PublicMerchantSubmission): MerchantDraft {
  const draft = createEmptyMerchantDraft(submission.id, submission.locale);
  const localized = (value: string) => ({ th: value, en: value, zh: value });
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

function submissionBody(draft: MerchantDraft, locale: Locale) {
  return {
    clientSubmissionId: draft.id,
    locale,
    name: draft.name[locale],
    category: draft.category[locale],
    address: draft.address[locale],
    phone: draft.phone,
    hours: draft.hours,
    lineId: draft.lineId,
    images: draft.images,
  };
}

type MerchantDraftContextValue = {
  draft: MerchantDraft;
  merchants: MerchantDraft[];
  hydrated: boolean;
  syncState: "idle" | "syncing" | "synced" | "error";
  syncServer: () => Promise<void>;
  submitMerchant: (next: MerchantDraft, locale: Locale, idToken: string) => Promise<string>;
  updateMerchant: (next: MerchantDraft, locale: Locale, idToken: string) => Promise<void>;
  selectMerchant: (id: string) => Promise<void>;
  deleteMerchant: (id: string) => Promise<void>;
};

const MerchantDraftContext = createContext<MerchantDraftContextValue | null>(null);

export function MerchantDraftProvider({ children }: { children: React.ReactNode }) {
  const { status: lineStatus, isInClient, isLoggedIn, idToken } = useLiff();
  const emptyDraftRef = useRef(createEmptyMerchantDraft("unsubmitted", "th"));
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const workspaceRef = useRef(workspace);

  const updateWorkspace = useCallback((next: MerchantWorkspace) => {
    workspaceRef.current = next;
    setWorkspace(next);
  }, []);

  useEffect(() => {
    // Version 3 has no persistent device merchant database. Remove only this app's legacy data.
    window.localStorage.removeItem("merchant-launchpad-draft-v1");
    window.indexedDB.deleteDatabase("merchant-launchpad");
  }, []);

  const syncServer = useCallback(async () => {
    if (lineStatus !== "ready" || !isInClient || !isLoggedIn || !idToken) throw new Error("LINE_TOKEN_REQUIRED");
    setSyncState("syncing");
    try {
      const response = await fetch("/api/submissions", { headers: { authorization: `Bearer ${idToken}` }, cache: "no-store" });
      const payload = await response.json() as { submissions?: PublicMerchantSubmission[] };
      if (!response.ok || !payload.submissions) throw new Error("SYNC_FAILED");
      const merchants = payload.submissions.map(submissionToDraft);
      const selectedId = merchants.some((item) => item.id === workspaceRef.current.selectedId)
        ? workspaceRef.current.selectedId
        : merchants[0]?.id || "";
      updateWorkspace({ version: 2, selectedId, merchants, events: workspaceRef.current.events });
      setSyncState("synced");
    } catch {
      setSyncState("error");
      throw new Error("SYNC_FAILED");
    }
  }, [idToken, isInClient, isLoggedIn, lineStatus, updateWorkspace]);

  useEffect(() => {
    if (lineStatus === "loading") return;
    if (lineStatus === "ready" && isInClient && isLoggedIn && idToken) {
      updateWorkspace(emptyWorkspace);
      void syncServer().catch(() => undefined).finally(() => setHydrated(true));
    } else {
      // A normal browser has no verified LINE owner identity, so it must not
      // invent a second, device-local merchant list.
      updateWorkspace(emptyWorkspace);
      setHydrated(true);
    }
  }, [idToken, isInClient, isLoggedIn, lineStatus, syncServer, updateWorkspace]);

  useEffect(() => {
    if (!hydrated || !isInClient || !idToken) return;
    const refreshOnFocus = () => { if (document.visibilityState === "visible") void syncServer().catch(() => undefined); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => document.removeEventListener("visibilitychange", refreshOnFocus);
  }, [hydrated, idToken, isInClient, syncServer]);

  const value = useMemo<MerchantDraftContextValue>(() => ({
    draft: workspace.merchants.find((item) => item.id === workspace.selectedId) || workspace.merchants[0] || emptyDraftRef.current,
    merchants: workspace.merchants,
    hydrated,
    syncState,
    syncServer,
    submitMerchant: async (draft, locale, token) => {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(submissionBody(draft, locale)),
      });
      const payload = await response.json() as { submission?: PublicMerchantSubmission; error?: string };
      if (!response.ok || !payload.submission) throw new Error(payload.error || "SUBMISSION_FAILED");
      const submitted = submissionToDraft(payload.submission);
      const current = workspaceRef.current;
      updateWorkspace({ ...current, selectedId: submitted.id, merchants: [submitted, ...current.merchants.filter((item) => item.id !== submitted.id)] });
      return submitted.id;
    },
    updateMerchant: async (draft, locale, token) => {
      const response = await fetch(`/api/submissions/${draft.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(submissionBody(draft, locale)),
      });
      const payload = await response.json() as { submission?: PublicMerchantSubmission; error?: string };
      if (!response.ok || !payload.submission) throw new Error(payload.error || "UPDATE_FAILED");
      const updated = submissionToDraft(payload.submission);
      const current = workspaceRef.current;
      updateWorkspace({ ...current, selectedId: updated.id, merchants: current.merchants.map((item) => item.id === updated.id ? updated : item) });
    },
    selectMerchant: async (id) => {
      const current = workspaceRef.current;
      if (current.merchants.some((item) => item.id === id)) updateWorkspace({ ...current, selectedId: id });
    },
    deleteMerchant: async (id) => {
      if (/^[a-f0-9]{24}$/.test(id)) {
        if (!idToken) throw new Error("LINE_TOKEN_REQUIRED");
        const response = await fetch(`/api/submissions/${id}`, { method: "DELETE", headers: { authorization: `Bearer ${idToken}` } });
        if (!response.ok) {
          const payload = await response.json() as { error?: string };
          throw new Error(payload.error || "DELETE_FAILED");
        }
      }
      const current = workspaceRef.current;
      const remaining = current.merchants.filter((item) => item.id !== id);
      updateWorkspace({ ...current, selectedId: remaining[0]?.id || "", merchants: remaining });
    },
  }), [hydrated, idToken, syncServer, syncState, updateWorkspace, workspace]);

  return <MerchantDraftContext.Provider value={value}>{children}</MerchantDraftContext.Provider>;
}

export function useMerchantDraft() {
  const context = useContext(MerchantDraftContext);
  if (!context) throw new Error("useMerchantDraft must be used inside MerchantDraftProvider");
  return context;
}
