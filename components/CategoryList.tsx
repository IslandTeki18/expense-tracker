"use client";

import { Id } from "@/convex/_generated/dataModel";

interface Category {
  _id: Id<"categories">;
  nameDisplay: string;
  color: string;
}

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export default function CategoryList({
  categories,
  onEdit,
  onDelete,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No categories yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
      {categories.map((cat) => (
        <div
          key={cat._id}
          className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
        >
          <span
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {cat.nameDisplay}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {cat.color.toUpperCase()}
          </span>
          <button
            onClick={() => onEdit(cat)}
            className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
