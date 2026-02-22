"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatCents } from "@/lib/money";

export default function BalanceHeader({ isUnlocked }: { isUnlocked: boolean }) {
  const result = useQuery(api.transactions.getBalance, isUnlocked ? {} : "skip");

  if (result === undefined) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Working Balance</p>
        <div className="mt-1 h-9 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const { balanceCents } = result;
  const isNegative = balanceCents < 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Working Balance</p>
      <p
        className={`mt-1 text-3xl font-bold ${isNegative ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
      >
        {formatCents(balanceCents)}
      </p>
    </div>
  );
}
