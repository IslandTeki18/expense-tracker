"use client";

import { formatCents } from "@/lib/money";

interface TopCategoriesListProps {
  categories: { name: string; color: string; amount: number }[];
  totalExpenses: number;
}

export default function TopCategoriesList({
  categories,
  totalExpenses,
}: TopCategoriesListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Top Categories
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No categorized expenses in this period
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Top Categories
      </h3>
      <ul className="space-y-3">
        {categories.map((cat) => {
          const pct = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
          return (
            <li key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {cat.name}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatCents(cat.amount)} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
