"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TransactionRow from "./TransactionRow";
import TransactionSortHeader, {
  type SortField,
  type SortDirection,
} from "./TransactionSortHeader";
import CategoryFilterControl, {
  type CategoryFilterValue,
} from "./CategoryFilterControl";
import PaginationControl from "./PaginationControl";
import QueryErrorBoundary from "./QueryErrorBoundary";

export default function TransactionList({ isUnlocked }: { isUnlocked: boolean }) {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>(null);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  }, [sortField]);

  const handleFilterChange = useCallback((value: CategoryFilterValue) => {
    setCategoryFilter(value);
    setPage(1);
  }, []);

  const result = useQuery(
    api.transactions.listTransactions,
    isUnlocked
      ? {
          page,
          sortField,
          sortDirection,
          categoryFilter,
        }
      : "skip",
  );

  return (
    <div className="space-y-3">
      <CategoryFilterControl
        isUnlocked={isUnlocked}
        value={categoryFilter}
        onChange={handleFilterChange}
      />

      <QueryErrorBoundary fallbackMessage="Failed to load transactions. Please try again.">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
          <TransactionSortHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {result === undefined ? (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
                >
                  <div className="h-5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : result.transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No transactions found.
              </p>
            </div>
          ) : (
            <>
              {result.transactions.map((txn) => (
                <TransactionRow key={txn._id} txn={txn} />
              ))}
              <PaginationControl
                page={result.page}
                totalPages={result.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </QueryErrorBoundary>
    </div>
  );
}
