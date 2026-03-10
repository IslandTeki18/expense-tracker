"use client";

import { formatCents } from "@/lib/money";

interface DashboardSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

export default function DashboardSummaryCards({
  totalIncome,
  totalExpenses,
  transactionCount,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">Total Income</p>
        <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-300">
          {formatCents(totalIncome)}
        </p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">Total Expenses</p>
        <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-300">
          {formatCents(totalExpenses)}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
        <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-gray-200">
          {transactionCount}
        </p>
      </div>
    </div>
  );
}
