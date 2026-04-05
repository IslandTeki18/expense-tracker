"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type StoreFilterValue = Id<"grocery_stores"> | "no-store" | null;

interface GroceryStoreFilterControlProps {
  isUnlocked: boolean;
  value: StoreFilterValue;
  onChange: (value: StoreFilterValue) => void;
}

export default function GroceryStoreFilterControl({
  isUnlocked,
  value,
  onChange,
}: GroceryStoreFilterControlProps) {
  const stores = useQuery(
    api.groceryStores.listStores,
    isUnlocked ? {} : "skip",
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          value === null
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        All
      </button>
      <button
        onClick={() => onChange("no-store")}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          value === "no-store"
            ? "bg-gray-600 text-white dark:bg-gray-400 dark:text-gray-900"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        No Store
      </button>
      {stores?.map((store) => (
        <button
          key={store._id}
          onClick={() => onChange(store._id)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            value === store._id
              ? "text-white"
              : "hover:opacity-80"
          }`}
          style={{
            backgroundColor: value === store._id ? store.color : `${store.color}20`,
            color: value === store._id ? "white" : store.color,
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: store.color }}
          />
          {store.nameDisplay}
        </button>
      ))}
    </div>
  );
}
