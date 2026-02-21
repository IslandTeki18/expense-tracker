"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

export default function UnlockPage() {
  const { isUnlocked, isLoading, unlock } = useAuth();
  const router = useRouter();
  const verifyPasscode = useAction(api.passcode.verifyPasscode);

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && isUnlocked) {
      router.replace("/dashboard");
    }
  }, [isLoading, isUnlocked, router]);

  useEffect(() => {
    if (cooldownEnd === null) return;

    const tick = () => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCooldownEnd(null);
        setCooldownRemaining(0);
        setFailCount(0);
        setError("");
        inputRef.current?.focus();
      } else {
        setCooldownRemaining(Math.ceil(remaining / 1000));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEnd]);

  if (isLoading || isUnlocked) return null;

  const isCoolingDown = cooldownEnd !== null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = passcode.trim();
    if (!trimmed) {
      setError("Please enter a passcode.");
      setPasscode("");
      return;
    }

    setSubmitting(true);
    try {
      const { success } = await verifyPasscode({ attempt: trimmed });
      setPasscode("");

      if (success) {
        unlock();
        router.replace("/dashboard");
      } else {
        const next = failCount + 1;
        setFailCount(next);

        if (next >= MAX_ATTEMPTS) {
          setCooldownEnd(Date.now() + COOLDOWN_MS);
          setError("Too many attempts. Please wait.");
        } else {
          setError("Incorrect passcode.");
        }
        inputRef.current?.focus();
      }
    } catch {
      setError("Something went wrong. Try again.");
      setPasscode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md"
      >
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
          Enter Passcode
        </h1>

        <input
          ref={inputRef}
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          disabled={submitting || isCoolingDown}
          placeholder="Passcode"
          autoFocus
          className="mb-4 w-full rounded border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {error && (
          <p className="mb-4 text-sm text-red-600">
            {error}
            {isCoolingDown && ` ${cooldownRemaining}s remaining.`}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || isCoolingDown}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {submitting ? "Verifying..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}
