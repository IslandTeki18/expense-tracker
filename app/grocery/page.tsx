"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/convex/_generated/api";
import GroceryAddForm from "@/components/GroceryAddForm";
import GroceryList from "@/components/GroceryList";
import GroceryStoreFilterControl, {
  StoreFilterValue,
} from "@/components/GroceryStoreFilterControl";

export default function GroceryPage() {
  const { isUnlocked, isLoading } = useAuth();
  const router = useRouter();
  const [storeFilter, setStoreFilter] = useState<StoreFilterValue>(null);

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

        <GroceryAddForm isUnlocked={isUnlocked} />

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
            person="you"
            storeFilter={storeFilter}
          />
        )}
      </div>
    </main>
  );
}
