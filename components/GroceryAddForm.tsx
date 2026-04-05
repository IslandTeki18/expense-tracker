"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface GroceryAddFormProps {
  isUnlocked: boolean;
}

export default function GroceryAddForm({ isUnlocked }: GroceryAddFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [storeId, setStoreId] = useState<Id<"grocery_stores"> | "">("");
  const [addedBy, setAddedBy] = useState<"landon" | "emma">("landon");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stores = useQuery(
    api.groceryStores.listStores,
    isUnlocked ? {} : "skip",
  );
  const addItem = useMutation(api.grocery.addItem);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await addItem({
        name: trimmed,
        quantity,
        storeId: storeId || null,
        addedBy,
      });
      setName("");
      setQuantity(1);
      setStoreId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="itemName"
            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Item
          </label>
          <input
            id="itemName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Milk"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="w-20">
          <label
            htmlFor="itemQty"
            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Qty
          </label>
          <input
            id="itemQty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="w-36">
          <label
            htmlFor="itemStore"
            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Store
          </label>
          <select
            id="itemStore"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value as Id<"grocery_stores"> | "")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">No store</option>
            {stores?.map((store) => (
              <option key={store._id} value={store._id}>
                {store.nameDisplay}
              </option>
            ))}
          </select>
        </div>

        <div className="w-28">
          <label
            htmlFor="itemAddedBy"
            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Added by
          </label>
          <select
            id="itemAddedBy"
            value={addedBy}
            onChange={(e) => setAddedBy(e.target.value as "landon" | "emma")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="landon">Landon</option>
            <option value="emma">Emma</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || name.trim().length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
