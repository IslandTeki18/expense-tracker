"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { Delete, Lock } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;
const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function UnlockPage() {
  const { isUnlocked, isLoading, unlock } = useAuth();
  const router = useRouter();
  const verifyPasscode = useAction(api.passcode.verifyPasscode);

  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  const locked = cooldownEnd !== null;
  const disabled = submitting || locked;

  const submit = useCallback(
    async (code: string) => {
      setSubmitting(true);
      setMessage(null);
      try {
        const { success } = await verifyPasscode({ attempt: code });
        if (success) {
          unlock();
          router.replace("/dashboard");
          return;
        }
        const next = failCount + 1;
        setFailCount(next);
        setErr(true);
        setTimeout(() => setErr(false), 450);
        if (next >= MAX_ATTEMPTS) {
          setCooldownEnd(Date.now() + COOLDOWN_MS);
        } else {
          setMessage(`Wrong passcode · ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} left`);
        }
      } catch {
        setMessage("Something went wrong. Try again.");
      } finally {
        setPin("");
        setSubmitting(false);
      }
    },
    [verifyPasscode, unlock, router, failCount],
  );

  const press = useCallback(
    (d: string) => {
      if (disabled || pin.length >= PIN_LENGTH) return;
      const next = pin + d;
      setPin(next);
      if (next.length === PIN_LENGTH) setTimeout(() => submit(next), 140);
    },
    [disabled, pin, submit],
  );

  useEffect(() => {
    if (!isLoading && isUnlocked) router.replace("/dashboard");
  }, [isLoading, isUnlocked, router]);

  useEffect(() => {
    if (cooldownEnd === null) return;
    const tick = () => {
      const left = cooldownEnd - Date.now();
      if (left <= 0) {
        setCooldownEnd(null);
        setRemaining(0);
        setFailCount(0);
        setMessage(null);
      } else {
        setRemaining(Math.ceil(left / 1000));
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [cooldownEnd]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  if (isLoading || isUnlocked) return null;

  return (
    <main className="m-page" style={{ display: "flex", flexDirection: "column", paddingBottom: 30 }}>
      <div className="gt-brand" style={{ marginTop: 18 }}>
        <div className="gt-brand-mark">
          L&amp;E<span className="gt-brand-tick" />
        </div>
        <div className="gt-brand-word">
          SHARED<span style={{ color: "var(--accent)" }}>/</span>LEDGER
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <span className="eyebrow">ENTER PASSCODE</span>
      <h1 className="m-title" style={{ marginBottom: 4 }}>
        Unlock_
      </h1>
      <p style={{ color: "var(--fg-muted)", fontSize: 12, margin: "0 0 18px" }}>
        Locked until the 4-digit passcode is verified.
      </p>

      <div className={`gt-pin-dots ${err ? "gt-shake" : ""}`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className="gt-pin-dot" data-filled={i < pin.length ? "1" : "0"} data-err={err ? "1" : "0"} />
        ))}
      </div>

      {locked ? (
        <div className="gt-lockout">
          <Lock size={20} />
          <span className="eyebrow" style={{ color: "var(--danger)" }}>
            TOO MANY ATTEMPTS
          </span>
          <b>{remaining}s</b>
          <span>Cooldown active. Try again shortly.</span>
        </div>
      ) : (
        <div className="gt-keypad">
          {KEYS.map((k) => (
            <button key={k} type="button" className="gt-key" disabled={disabled} onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <button type="button" className="gt-key gt-key-fn" disabled={disabled} onClick={() => setPin("")}>
            CLR
          </button>
          <button type="button" className="gt-key" disabled={disabled} onClick={() => press("0")}>
            0
          </button>
          <button
            type="button"
            className="gt-key gt-key-fn"
            disabled={disabled}
            onClick={() => setPin((p) => p.slice(0, -1))}
            aria-label="Backspace"
          >
            <Delete size={18} />
          </button>
        </div>
      )}

      <p className="gt-login-foot">
        {submitting ? "Verifying…" : message ? <span style={{ color: "var(--danger)" }}>{message}</span> : " "}
      </p>
    </main>
  );
}
