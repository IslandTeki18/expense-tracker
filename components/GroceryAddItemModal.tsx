"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface GroceryAddItemModalProps {
  isUnlocked: boolean;
  onClose: () => void;
}

export default function GroceryAddItemModal({
  isUnlocked,
  onClose,
}: GroceryAddItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [storeId, setStoreId] = useState<Id<"grocery_stores"> | "">("");
  const [addedBy, setAddedBy] = useState<"landon" | "emma">("landon");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stores = useQuery(
    api.groceryStores.listStores,
    isUnlocked ? {} : "skip",
  );
  const addItem = useMutation(api.grocery.addItem);

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
      const qty = Math.max(1, parseInt(quantity) || 1);
      await addItem({
        name: trimmed,
        quantity: qty,
        storeId: storeId || null,
        addedBy,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
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
            Add Item
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
              htmlFor="addItemName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Item
            </label>
            <input
              id="addItemName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Milk"
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="addItemQty"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Quantity
            </label>
            <input
              id="addItemQty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="addItemStore"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Store
            </label>
            <select
              id="addItemStore"
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

          <div>
            <label
              htmlFor="addItemAddedBy"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Added by
            </label>
            <select
              id="addItemAddedBy"
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value as "landon" | "emma")}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="landon">Landon</option>
              <option value="emma">Emma</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || name.trim().length === 0 || (parseInt(quantity) || 0) < 1}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
