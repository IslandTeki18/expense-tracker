"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/convex/_generated/api";
import GroceryAddItemModal from "@/components/GroceryAddItemModal";
import GroceryList from "@/components/GroceryList";
import GroceryStoreFilterControl, {
  StoreFilterValue,
} from "@/components/GroceryStoreFilterControl";

export default function GroceryPage() {
  const { isUnlocked, isLoading } = useAuth();
  const router = useRouter();
  const [storeFilter, setStoreFilter] = useState<StoreFilterValue>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [isLoading, isUnlocked, router]);

  const items = useQuery(
    api.grocery.listItems,
    isUnlocked ? {} : "skip",
  );

  if (isLoading || !isUnlocked) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Grocery List
            </h1>
          </div>
          <Link
            href="/grocery/stores"
            className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Stores
          </Link>
        </div>

        <GroceryStoreFilterControl
          isUnlocked={isUnlocked}
          value={storeFilter}
          onChange={setStoreFilter}
        />

        {items === undefined ? (
          <div className="rounded-lg bg-white shadow-sm dark:bg-gray-900">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
              >
                <div className="h-5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : (
          <GroceryList
            items={items}
            isUnlocked={isUnlocked}
            person="landon"
            storeFilter={storeFilter}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95"
        aria-label="Add item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {showAddModal && (
        <GroceryAddItemModal
          isUnlocked={isUnlocked}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  );
}
