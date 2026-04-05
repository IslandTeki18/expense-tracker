"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import GroceryStoreBadge from "./GroceryStoreBadge";

interface GroceryItemRowProps {
  item: {
    _id: Id<"grocery_items">;
    name: string;
    quantity: number;
    addedBy: "landon" | "emma";
    completed: boolean;
    completedBy: "landon" | "emma" | null;
    store: {
      _id: Id<"grocery_stores">;
      nameDisplay: string;
      color: string;
    } | null;
  };
  person: "landon" | "emma";
  onEdit: () => void;
}

export default function GroceryItemRow({ item, person, onEdit }: GroceryItemRowProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleItem = useMutation(api.grocery.toggleItem);
  const deleteItem = useMutation(api.grocery.deleteItem);

  async function handleToggle() {
    setIsToggling(true);
    try {
      await toggleItem({ itemId: item._id, completedBy: person });
    } catch {
      // Convex reactivity will handle state
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteItem({ itemId: item._id });
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={handleToggle}
        disabled={isToggling}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              item.completed
                ? "text-gray-400 line-through dark:text-gray-500"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {item.name}
          </span>
          {item.quantity > 1 && (
            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              x{item.quantity}
            </span>
          )}
          {item.store && (
            <GroceryStoreBadge
              storeName={item.store.nameDisplay}
              storeColor={item.store.color}
            />
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {item.completed && item.completedBy
            ? `Done by ${item.completedBy === "landon" ? "Landon" : "Emma"}`
            : `Added by ${item.addedBy === "landon" ? "Landon" : "Emma"}`}
        </p>
      </div>

      {!showDeleteConfirm ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "..." : "Confirm"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
