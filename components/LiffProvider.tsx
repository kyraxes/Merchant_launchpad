"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { liffId, liffUrl } from "@/lib/line";

type LineProfile = {
  displayName: string;
  pictureUrl?: string;
};

type LiffStatus = "loading" | "ready" | "error";

type LiffContextValue = {
  status: LiffStatus;
  isInClient: boolean;
  isLoggedIn: boolean;
  profile: LineProfile | null;
  idToken: string | null;
  error: string | null;
  liffUrl: string;
  login: () => void;
};

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LiffStatus>("loading");
  const [isInClient, setIsInClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initializeLiff() {
      try {
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId });
        if (!active) return;

        const inClient = liff.isInClient();
        const loggedIn = liff.isLoggedIn();
        setIsInClient(inClient);
        setIsLoggedIn(loggedIn);
        setIdToken(loggedIn ? liff.getIDToken() : null);

        if (loggedIn) {
          try {
            const lineProfile = await liff.getProfile();
            if (active) {
              setProfile({
                displayName: lineProfile.displayName,
                pictureUrl: lineProfile.pictureUrl,
              });
            }
          } catch {
            // The app remains usable if profile permission was not granted.
          }
        }

        if (active) setStatus("ready");
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "LIFF initialization failed");
        setStatus("error");
      }
    }

    void initializeLiff();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<LiffContextValue>(
    () => ({
      status,
      isInClient,
      isLoggedIn,
      profile,
      idToken,
      error,
      liffUrl,
      login: () => {
        void import("@line/liff").then(({ default: liff }) => {
          if (!liff.isInClient() && !liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
          }
        });
      },
    }),
    [error, idToken, isInClient, isLoggedIn, profile, status],
  );

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiff() {
  const context = useContext(LiffContext);
  if (!context) throw new Error("useLiff must be used inside LiffProvider");
  return context;
}
