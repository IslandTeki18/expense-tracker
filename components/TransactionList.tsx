"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TransactionRow from "./TransactionRow";

const LIST_LIMIT = 50;

export default function TransactionList() {
  const transactions = useQuery(api.transactions.listTransactions, {
    limit: LIST_LIMIT,
  });

  if (transactions === undefined) {
    return (
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-gray-100 px-4 py-3 last:border-b-0">
            <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-sm">
      {transactions.map((txn) => (
        <TransactionRow key={txn._id} txn={txn} />
      ))}
    </div>
  );
}
