"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Person } from "@/lib/types";

interface ActorContextValue {
  actor: Person;
  setActor: (p: Person) => void;
}

const ActorContext = createContext<ActorContextValue | null>(null);
const STORAGE_KEY = "actor";

/** Who is "acting" in the UI: defaults enteredBy / spentBy / addedBy / completedBy. */
export function ActorProvider({ children }: { children: ReactNode }) {
  // Consumers all live behind the AppShell gate (client-only), so reading
  // localStorage in the initializer cannot cause a hydration mismatch.
  const [actor, setActorState] = useState<Person>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return stored === "emma" ? "emma" : "landon";
    } catch {
      return "landon";
    }
  });

  function setActor(p: Person) {
    setActorState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // ignore
    }
  }

  return (
    <ActorContext.Provider value={{ actor, setActor }}>
      {children}
    </ActorContext.Provider>
  );
}

export function useActor(): ActorContextValue {
  const ctx = useContext(ActorContext);
  if (!ctx) throw new Error("useActor must be used within an ActorProvider");
  return ctx;
}
