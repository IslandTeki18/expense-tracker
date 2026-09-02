"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { ChevronRight, Lock, Moon, Sun } from "lucide-react";
import { api } from "@/convex/_generated/api";
import AppShell, { AppBar } from "@/components/AppShell";
import { useAuth } from "@/components/AuthContext";
import { Segmented } from "@/components/ui";
import EntityFormModal, { type EntityKind } from "@/components/EntityFormModal";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

const TABS = [
  { value: "category" as EntityKind, label: "CATEGORIES" },
  { value: "store" as EntityKind, label: "GROCERY STORES" },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <QueryErrorBoundary fallbackMessage="Failed to load settings.">
        <SettingsScreen />
      </QueryErrorBoundary>
    </AppShell>
  );
}

function SettingsScreen() {
  const router = useRouter();
  const { lock } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [tab, setTab] = useState<EntityKind>("category");
  const [modal, setModal] = useState<{ kind: EntityKind; edit?: { id: string; nameDisplay: string; color: string } } | null>(null);

  const categories = useQuery(api.categories.listCategories, {});
  const stores = useQuery(api.groceryStores.listStores, {});
  const list = tab === "category" ? categories : stores;
  const isDark = resolvedTheme === "dark";

  return (
    <>
      <AppBar
        sub="SETTINGS"
        title={tab === "category" ? "Categories" : "Stores"}
        right={
          <button type="button" className="m-icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        }
      />
      <Segmented options={TABS} value={tab} onChange={setTab} />

      <div className="m-card" style={{ padding: 0, marginTop: 14 }}>
        {list === undefined ? (
          <div className="gt-skel" style={{ height: 160, border: 0 }} />
        ) : (
          list.map((e) => (
            <button key={e._id} type="button" className="gt-list-row" onClick={() => setModal({ kind: tab, edit: { id: e._id, nameDisplay: e.nameDisplay, color: e.color } })}>
              <span className="gt-swatch-lg" style={{ background: e.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="gt-list-name">{e.nameDisplay}</div>
                <div className="gt-list-sub">{e.color.toUpperCase()}</div>
              </div>
              <ChevronRight size={15} color="var(--fg-subtle)" />
            </button>
          ))
        )}
        {list && !list.length && (
          <div className="gt-list-sub" style={{ padding: "18px 14px" }}>
            No {tab === "category" ? "categories" : "stores"} yet.
          </div>
        )}
        <button type="button" className="m-btn m-btn-ghost" style={{ margin: 10, width: "calc(100% - 20px)" }} onClick={() => setModal({ kind: tab })}>
          + NEW {tab.toUpperCase()}
        </button>
      </div>

      <div className="m-section-head">
        <span className="eyebrow">APP</span>
      </div>
      <button
        type="button"
        className="m-node"
        onClick={() => {
          lock();
          router.replace("/unlock");
        }}
      >
        <Lock size={16} color="var(--fg-muted)" />
        <div className="m-node-main">
          <div className="m-node-id">Lock app</div>
          <div className="m-node-region">Requires passcode to re-enter</div>
        </div>
        <ChevronRight size={15} color="var(--fg-subtle)" />
      </button>

      {modal && <EntityFormModal kind={modal.kind} editData={modal.edit} onClose={() => setModal(null)} />}
    </>
  );
}
