"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, List, ShoppingCart, Settings2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

const TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/transactions", icon: List, label: "Ledger" },
  { href: "/grocery", icon: ShoppingCart, label: "Grocery" },
  { href: "/settings", icon: Settings2, label: "Settings" },
] as const;

function tabActive(href: string, pathname: string): boolean {
  if (href === "/transactions") return pathname.startsWith("/transaction");
  return pathname.startsWith(href);
}

/**
 * Passcode gate + mobile chrome. Children are only mounted once unlocked, so
 * screens can call Convex queries without "skip" guards.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { isUnlocked, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isUnlocked) router.replace("/unlock");
  }, [isLoading, isUnlocked, router]);

  if (isLoading || !isUnlocked) return null;

  return (
    <>
      <main className="m-page">{children}</main>
      <nav className="m-tabbar" aria-label="Primary">
        <div className="m-tabbar-inner">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="m-tab" data-active={tabActive(t.href, pathname) ? "1" : "0"}>
              <t.icon size={20} />
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export function AppBar({
  sub,
  title,
  right,
  backHref,
}: {
  sub: ReactNode;
  title: string;
  right?: ReactNode;
  backHref?: string;
}) {
  return (
    <header className="m-appbar">
      <div style={{ minWidth: 0 }}>
        {backHref ? (
          <Link href={backHref} className="gt-back">
            <ArrowLeft size={13} />
            {sub}
          </Link>
        ) : (
          <div className="eyebrow" style={{ color: "var(--fg-subtle)" }}>
            {sub}
          </div>
        )}
        <h1 className="m-title">{title}</h1>
      </div>
      {right}
    </header>
  );
}
