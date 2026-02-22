"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TransactionRow from "./TransactionRow";

const LIST_LIMIT = 50;

export default function TransactionList({ isUnlocked }: { isUnlocked: boolean }) {
  const transactions = useQuery(
    api.transactions.listTransactions,
    isUnlocked ? { limit: LIST_LIMIT } : "skip",
  );

  if (transactions === undefined) {
    return (
      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-900">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800">
            <div className="h-5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-sm dark:bg-gray-900">
      {transactions.map((txn) => (
        <TransactionRow key={txn._id} txn={txn} />
      ))}
    </div>
  );
}
