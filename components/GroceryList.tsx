"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import GroceryItemRow from "./GroceryItemRow";
import GroceryItemEditModal from "./GroceryItemEditModal";
import { StoreFilterValue } from "./GroceryStoreFilterControl";

interface GroceryItem {
  _id: Id<"grocery_items">;
  name: string;
  quantity: number;
  storeId: Id<"grocery_stores"> | null;
  addedBy: "landon" | "emma";
  completed: boolean;
  completedBy: "landon" | "emma" | null;
  createdAt: number;
  store: {
    _id: Id<"grocery_stores">;
    nameDisplay: string;
    color: string;
  } | null;
}

interface GroceryListProps {
  items: GroceryItem[];
  isUnlocked: boolean;
  person: "landon" | "emma";
  storeFilter: StoreFilterValue;
}

export default function GroceryList({
  items,
  isUnlocked,
  person,
  storeFilter,
}: GroceryListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [editTarget, setEditTarget] = useState<GroceryItem | null>(null);

  const clearCompleted = useMutation(api.grocery.clearCompleted);

  const filtered = items.filter((item) => {
    if (storeFilter === null) return true;
    if (storeFilter === "no-store") return item.storeId === null;
    return item.storeId === storeFilter;
  });

  const activeItems = filtered
    .filter((i) => !i.completed)
    .sort((a, b) => b.createdAt - a.createdAt);

  const completedItems = filtered
    .filter((i) => i.completed)
    .sort((a, b) => b.createdAt - a.createdAt);

  async function handleClearCompleted() {
    setIsClearing(true);
    try {
      await clearCompleted({});
    } catch {
      // Convex reactivity handles state
    } finally {
      setIsClearing(false);
    }
  }

  if (filtered.length === 0 && storeFilter !== null) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No items for this store filter.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No items yet. Add your first grocery item above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeItems.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
          {activeItems.map((item) => (
            <GroceryItemRow
              key={item._id}
              item={item}
              person={person}
              onEdit={() => setEditTarget(item)}
            />
          ))}
        </div>
      )}

      {activeItems.length === 0 && completedItems.length > 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All items completed!
          </p>
        </div>
      )}

      {completedItems.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="text-xs">{showCompleted ? "\u25BC" : "\u25B6"}</span>
            Done ({completedItems.length})
          </button>

          {showCompleted && (
            <div className="mt-2 space-y-2">
              <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
                {completedItems.map((item) => (
                  <GroceryItemRow
                    key={item._id}
                    item={item}
                    person={person}
                    onEdit={() => setEditTarget(item)}
                  />
                ))}
              </div>
              <button
                onClick={handleClearCompleted}
                disabled={isClearing}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
              >
                {isClearing ? "Clearing..." : "Clear all completed"}
              </button>
            </div>
          )}
        </div>
      )}

      {editTarget && (
        <GroceryItemEditModal
          isUnlocked={isUnlocked}
          itemId={editTarget._id}
          initialName={editTarget.name}
          initialQuantity={editTarget.quantity}
          initialStoreId={editTarget.storeId}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
