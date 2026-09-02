"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";

interface AuthContextValue {
  isUnlocked: boolean;
  isLoading: boolean;
  unlock: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "unlocked";
const EVENT = "auth-change";

// localStorage-backed store; useSyncExternalStore keeps SSR (loading) and the
// client snapshot consistent without setState-in-effect.
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
const getSnapshot = () => localStorage.getItem(STORAGE_KEY) === "true";
const getServerSnapshot = () => null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const unlock = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return (
    <AuthContext.Provider value={{ isUnlocked: state === true, isLoading: state === null, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
