"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16 }}>
        <div>
          <span className="eyebrow">ERROR</span>
          <h1 className="m-title">Something went wrong_</h1>
          <p style={{ color: "var(--fg-muted)", fontSize: 12 }}>An unexpected error occurred. Please try again.</p>
          <button type="button" className="gt-btn gt-btn-primary" onClick={reset}>
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
