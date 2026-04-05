"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface GroceryItemEditModalProps {
  isUnlocked: boolean;
  itemId: Id<"grocery_items">;
  initialName: string;
  initialQuantity: number;
  initialStoreId: Id<"grocery_stores"> | null;
  onClose: () => void;
}

export default function GroceryItemEditModal({
  isUnlocked,
  itemId,
  initialName,
  initialQuantity,
  initialStoreId,
  onClose,
}: GroceryItemEditModalProps) {
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [storeId, setStoreId] = useState<Id<"grocery_stores"> | "">(initialStoreId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stores = useQuery(
    api.groceryStores.listStores,
    isUnlocked ? {} : "skip",
  );
  const editItem = useMutation(api.grocery.editItem);

  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await editItem({
        itemId,
        name: trimmed,
        quantity,
        storeId: storeId || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit Item
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="editItemName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Item
            </label>
            <input
              id="editItemName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="editItemQty"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quantity
            </label>
            <input
              id="editItemQty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="editItemStore"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Store
            </label>
            <select
              id="editItemStore"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value as Id<"grocery_stores"> | "")}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">No store</option>
              {stores?.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.nameDisplay}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || name.trim().length === 0}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
