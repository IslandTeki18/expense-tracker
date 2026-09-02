import Link from "next/link";

export default function NotFound() {
  return (
    <main className="m-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
      <span className="eyebrow">404</span>
      <h1 className="m-title">Page not found_</h1>
      <p style={{ color: "var(--fg-muted)", fontSize: 12 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <div>
        <Link href="/dashboard" className="gt-btn gt-btn-primary">
          BACK HOME
        </Link>
      </div>
    </main>
  );
}
