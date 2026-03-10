"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CategoryList from "@/components/CategoryList";
import CategoryForm from "@/components/CategoryForm";
import CategoryDeleteDialog from "@/components/CategoryDeleteDialog";
import Link from "next/link";

interface EditTarget {
  categoryId: Id<"categories">;
  nameDisplay: string;
  color: string;
}

interface DeleteTarget {
  categoryId: Id<"categories">;
  nameDisplay: string;
}

export default function CategoriesPage() {
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

  const categories = useQuery(
    api.categories.listCategories,
    isUnlocked ? {} : "skip",
  );

  if (isLoading || !isUnlocked) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Categories
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Category
          </button>
        </div>

        {categories === undefined ? (
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
          <CategoryList
            categories={categories}
            onEdit={(cat) =>
              setEditTarget({
                categoryId: cat._id,
                nameDisplay: cat.nameDisplay,
                color: cat.color,
              })
            }
            onDelete={(cat) =>
              setDeleteTarget({
                categoryId: cat._id,
                nameDisplay: cat.nameDisplay,
              })
            }
          />
        )}

        {showForm && (
          <CategoryForm onClose={() => setShowForm(false)} />
        )}

        {editTarget && (
          <CategoryForm
            editData={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}

        {deleteTarget && (
          <CategoryDeleteDialog
            categoryId={deleteTarget.categoryId}
            categoryName={deleteTarget.nameDisplay}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </main>
  );
}
