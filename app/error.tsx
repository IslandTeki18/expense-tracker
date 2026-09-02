"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="m-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
      <span className="eyebrow">ERROR</span>
      <h1 className="m-title">Something went wrong_</h1>
      <p style={{ color: "var(--fg-muted)", fontSize: 12 }}>An unexpected error occurred. Please try again.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
        <button type="button" className="gt-btn gt-btn-primary" onClick={reset}>
          TRY AGAIN
        </button>
        <Link href="/dashboard" className="gt-btn gt-btn-outline">
          HOME
        </Link>
      </div>
    </main>
  );
}
