"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
type User = { id: string; username: string };
type Value = { user: User | null; status: "loading" | "ready" | "error"; refresh: () => Promise<void>; logout: () => Promise<void> };
const Context = createContext<Value | null>(null);
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Value["status"]>("loading");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/account/session", { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("ACCOUNT_ERROR");
      const data = await response.json(); setUser(data.user); setStatus("ready");
    } catch { setUser(null); setStatus("error"); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function logout() {
    const response = await fetch("/api/account/session", { method: "DELETE" });
    if (!response.ok) throw new Error("LOGOUT_FAILED");
    setUser(null); setStatus("ready");
  }
  return <Context.Provider value={{ user, status, refresh, logout }}>{children}</Context.Provider>;
}
export function useAccount() { const value = useContext(Context); if (!value) throw new Error("AccountProvider required"); return value; }
