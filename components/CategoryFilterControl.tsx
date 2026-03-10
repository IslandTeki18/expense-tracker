"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type CategoryFilterValue = Id<"categories"> | "uncategorized" | null;

interface CategoryFilterControlProps {
  isUnlocked: boolean;
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryFilterControl({
  isUnlocked,
  value,
  onChange,
}: CategoryFilterControlProps) {
  const categories = useQuery(
    api.categories.listCategories,
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
        onClick={() => onChange("uncategorized")}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          value === "uncategorized"
            ? "bg-gray-600 text-white dark:bg-gray-400 dark:text-gray-900"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Other
      </button>
      {categories?.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onChange(cat._id)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            value === cat._id
              ? "text-white"
              : "hover:opacity-80"
          }`}
          style={{
            backgroundColor: value === cat._id ? cat.color : `${cat.color}20`,
            color: value === cat._id ? "white" : cat.color,
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          {cat.nameDisplay}
        </button>
      ))}
    </div>
  );
}
