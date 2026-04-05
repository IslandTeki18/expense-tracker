"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import GroceryStoreList from "@/components/GroceryStoreList";
import GroceryStoreForm from "@/components/GroceryStoreForm";
import GroceryStoreDeleteDialog from "@/components/GroceryStoreDeleteDialog";
import Link from "next/link";

interface EditTarget {
  storeId: Id<"grocery_stores">;
  nameDisplay: string;
  color: string;
}

interface DeleteTarget {
  storeId: Id<"grocery_stores">;
  nameDisplay: string;
}

export default function GroceryStoresPage() {
  const { isUnlocked, isLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    if (!isLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [isLoading, isUnlocked, router]);

  const stores = useQuery(
    api.groceryStores.listStores,
    isUnlocked ? {} : "skip",
  );

  if (isLoading || !isUnlocked) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/grocery"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Grocery List
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Stores
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Store
          </button>
        </div>

        {stores === undefined ? (
          <div className="rounded-lg bg-white shadow-sm dark:bg-gray-900">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
              >
                <div className="h-5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : (
          <GroceryStoreList
            stores={stores}
            onEdit={(store) =>
              setEditTarget({
                storeId: store._id,
                nameDisplay: store.nameDisplay,
                color: store.color,
              })
            }
            onDelete={(store) =>
              setDeleteTarget({
                storeId: store._id,
                nameDisplay: store.nameDisplay,
              })
            }
          />
        )}

        {showForm && (
          <GroceryStoreForm onClose={() => setShowForm(false)} />
        )}

        {editTarget && (
          <GroceryStoreForm
            editData={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}

        {deleteTarget && (
          <GroceryStoreDeleteDialog
            storeId={deleteTarget.storeId}
            storeName={deleteTarget.nameDisplay}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </main>
  );
}
