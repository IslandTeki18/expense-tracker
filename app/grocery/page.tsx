"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PEOPLE } from "@/lib/display";
import AppShell, { AppBar } from "@/components/AppShell";
import { useActor } from "@/components/ActorContext";
import { ActorSwitch, Chip, ConfirmDialog, Empty } from "@/components/ui";
import GroceryItemModal from "@/components/GroceryItemModal";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

type Filter = null | "no-store" | Id<"grocery_stores">;

interface Item {
  _id: Id<"grocery_items">;
  name: string;
  quantity: number;
  storeId: Id<"grocery_stores"> | null;
  addedBy: "landon" | "emma";
  completed: boolean;
  completedBy: "landon" | "emma" | null;
  completedAt: number | null;
  createdAt: number;
  store: { nameDisplay: string; color: string } | null;
}

export default function GroceryPage() {
  return (
    <AppShell>
      <QueryErrorBoundary fallbackMessage="Failed to load the grocery list.">
        <GroceryScreen />
      </QueryErrorBoundary>
    </AppShell>
  );
}

function GroceryScreen() {
  const { actor, setActor } = useActor();
  const [filter, setFilter] = useState<Filter>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const items = useQuery(api.grocery.listItems, {});
  const stores = useQuery(api.groceryStores.listStores, {});
  const toggleItem = useMutation(api.grocery.toggleItem);
  const deleteItem = useMutation(api.grocery.deleteItem);
  const clearCompleted = useMutation(api.grocery.clearCompleted);

  const visible = (items ?? []).filter((i) => (filter === null ? true : filter === "no-store" ? i.storeId === null : i.storeId === filter));
  const active = visible.filter((i) => !i.completed).sort((a, b) => a.createdAt - b.createdAt);
  const done = visible.filter((i) => i.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  async function handleClear() {
    setIsClearing(true);
    try {
      await clearCompleted({});
      setConfirmClear(false);
    } finally {
      setIsClearing(false);
    }
  }

  const row = (i: Item) => (
    <div key={i._id} className="gt-gitem" data-done={i.completed ? "1" : "0"}>
      <button
        type="button"
        className="gt-check"
        data-on={i.completed ? "1" : "0"}
        onClick={() => toggleItem({ itemId: i._id, completedBy: actor })}
        aria-label={i.completed ? "Mark not done" : "Mark done"}
      >
        <Check size={14} />
      </button>
      <button type="button" onClick={() => setEditTarget(i)} style={{ minWidth: 0, flex: 1, background: "none", border: 0, padding: 0, textAlign: "left", color: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="gt-gname" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {i.name}
          </span>
          {i.quantity > 1 && <span className="gt-qty">×{i.quantity}</span>}
        </div>
        <div className="gt-gmeta">
          {i.store && <span style={{ color: i.store.color }}>{i.store.nameDisplay}</span>}
          <span>{i.completed && i.completedBy ? `done by ${PEOPLE[i.completedBy].name}` : `added by ${PEOPLE[i.addedBy].name}`}</span>
        </div>
      </button>
      <button type="button" className="m-icon-btn" style={{ width: 32, height: 32, border: 0 }} onClick={() => deleteItem({ itemId: i._id })} aria-label="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <>
      <AppBar sub={items ? `${active.length} TO BUY · ${done.length} DONE` : "GROCERY"} title="Grocery" right={<ActorSwitch value={actor} onChange={setActor} />} />

      <div className="m-chips-scroll">
        <Chip active={filter === null} onClick={() => setFilter(null)}>
          All stores
        </Chip>
        {stores?.map((s) => (
          <Chip key={s._id} active={filter === s._id} color={s.color} onClick={() => setFilter(s._id)}>
            {s.nameDisplay}
          </Chip>
        ))}
        <Chip active={filter === "no-store"} color="var(--fg-subtle)" onClick={() => setFilter("no-store")}>
          No store
        </Chip>
      </div>

      {items === undefined ? (
        <div className="gt-skel" style={{ height: 220, marginTop: 14 }} />
      ) : (
        <>
          <div className="m-card" style={{ padding: "2px 14px", marginTop: 14 }}>
            {active.map(row)}
            {!active.length && (
              <Empty icon={<ShoppingCart size={22} />}>{filter ? "Nothing to buy at this store." : "The list is clear. Add something with +"}</Empty>
            )}
          </div>
          {done.length > 0 && (
            <>
              <div className="gt-section-rule">
                <span className="eyebrow">COMPLETED · {done.length}</span>
                <span className="line" />
                <button type="button" className="gt-back" style={{ color: "var(--danger)" }} onClick={() => setConfirmClear(true)}>
                  CLEAR
                </button>
              </div>
              <div className="m-card" style={{ padding: "2px 14px" }}>
                {done.map(row)}
              </div>
            </>
          )}
        </>
      )}

      <button type="button" className="gt-fab" onClick={() => setShowAdd(true)} aria-label="Add item">
        <Plus size={24} />
      </button>

      {showAdd && <GroceryItemModal onClose={() => setShowAdd(false)} />}
      {editTarget && (
        <GroceryItemModal
          onClose={() => setEditTarget(null)}
          editData={{ itemId: editTarget._id, name: editTarget.name, quantity: editTarget.quantity, storeId: editTarget.storeId }}
        />
      )}
      {confirmClear && (
        <ConfirmDialog
          onClose={() => setConfirmClear(false)}
          onConfirm={handleClear}
          busy={isClearing}
          confirmLabel="CLEAR"
          title="Clear completed items?"
          body={`This permanently deletes all ${(items ?? []).filter((i) => i.completed).length} completed items from the list.`}
        />
      )}
    </>
  );
}
