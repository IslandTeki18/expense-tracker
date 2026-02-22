"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;
const PIN_LENGTH = 4;

export default function UnlockPage() {
  const { isUnlocked, isLoading, unlock } = useAuth();
  const router = useRouter();
  const verifyPasscode = useAction(api.passcode.verifyPasscode);

  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const clearAndFocusFirst = useCallback(() => {
    setDigits(Array(PIN_LENGTH).fill(""));
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }, []);

  const submitPin = useCallback(
    async (pin: string) => {
      setError("");
      setSubmitting(true);
      try {
        const { success } = await verifyPasscode({ attempt: pin });

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
          clearAndFocusFirst();
        }
      } catch {
        setError("Something went wrong. Try again.");
        clearAndFocusFirst();
      } finally {
        setSubmitting(false);
      }
    },
    [verifyPasscode, unlock, router, failCount, clearAndFocusFirst],
  );

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
        inputRefs.current[0]?.focus();
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
  const isDisabled = submitting || isCoolingDown;

  function handleDigitChange(index: number, value: string) {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (char && next.every((d) => d !== "")) {
      submitPin(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < PIN_LENGTH; i++) {
      next[i] = pasted[i] ?? "";
    }
    setDigits(next);

    const filledCount = next.filter((d) => d !== "").length;
    if (filledCount < PIN_LENGTH) {
      inputRefs.current[filledCount]?.focus();
    } else {
      inputRefs.current[PIN_LENGTH - 1]?.focus();
      submitPin(next.join(""));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const pin = digits.join("");
    if (pin.length < PIN_LENGTH) {
      setError("Enter all 4 digits.");
      return;
    }
    submitPin(pin);
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

        <div className="mb-4 flex justify-center gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={isDisabled}
              autoFocus={i === 0}
              autoComplete="off"
              className="h-14 w-14 rounded-lg border-2 border-gray-300 text-center text-2xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-red-600">
            {error}
            {isCoolingDown && ` ${cooldownRemaining}s remaining.`}
          </p>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {submitting ? "Verifying..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}
