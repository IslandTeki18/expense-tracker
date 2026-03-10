"use client";

import Link from "next/link";
import { formatCents } from "@/lib/money";
import { Id } from "@/convex/_generated/dataModel";
import CategoryBadge from "./CategoryBadge";

export interface TransactionRowData {
  _id: Id<"transactions">;
  type: "income" | "expense";
  createdAt: number;
  createdBy: "you" | "wife";
  updatedAt: number;
  categoryId: Id<"categories"> | null;
  categoryName: string | null;
  categoryColor: string | null;
  amountCents: number;
  entryDate: string | null;
  description: string | null;
  spentBy: "you" | "wife" | null;
  enteredBy: "you" | "wife";
  receiptFileId: Id<"_storage"> | null;
  versionCreatedAt: number;
}

function formatPersonLabel(person: "you" | "wife"): string {
  return person === "you" ? "You" : "Wife";
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year.slice(2)}`;
}

export default function TransactionRow({ txn }: { txn: TransactionRowData }) {
  const isIncome = txn.type === "income";
  const amountColor = isIncome
    ? "text-green-700 dark:text-green-400"
    : "text-red-700 dark:text-red-400";

  return (
    <Link
      href={`/transaction/${txn._id}`}
      className="block border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
    >
      {/* Mobile: two-line card layout */}
      <div className="sm:hidden">
        <div className="flex items-center gap-2">
          <CategoryBadge
            txnType={txn.type}
            categoryName={txn.categoryName}
            categoryColor={txn.categoryColor}
          />
          <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
            {txn.description ?? ""}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            {txn.entryDate ? formatDateShort(txn.entryDate) : "--"}
            {txn.type === "expense" && txn.spentBy && (
              <>
                <span>&middot;</span>
                <span>by {formatPersonLabel(txn.spentBy)}</span>
              </>
            )}
            {txn.receiptFileId && (
              <>
                <span>&middot;</span>
                <span className="text-blue-500" title="Has receipt">receipt</span>
              </>
            )}
          </span>
          <span className={`text-sm font-semibold ${amountColor}`}>
            {isIncome ? "+" : "-"}
            {formatCents(txn.amountCents)}
          </span>
        </div>
      </div>

      {/* Desktop: horizontal row layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        <span
          className={`inline-flex w-18 shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isIncome
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isIncome ? "Income" : "Expense"}
        </span>

        <span className={`w-24 shrink-0 text-right text-sm font-semibold ${amountColor}`}>
          {isIncome ? "+" : "-"}
          {formatCents(txn.amountCents)}
        </span>

        <span className="w-24 shrink-0 text-sm text-gray-500 dark:text-gray-400">
          {txn.entryDate ? txn.entryDate : "--"}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
          {txn.description ?? ""}
        </span>

        <CategoryBadge
          txnType={txn.type}
          categoryName={txn.categoryName}
          categoryColor={txn.categoryColor}
        />

        {txn.type === "expense" && txn.spentBy && (
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            by {formatPersonLabel(txn.spentBy)}
          </span>
        )}

        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {formatPersonLabel(txn.enteredBy)}
        </span>

        {txn.receiptFileId && (
          <span className="shrink-0 text-xs text-blue-500" title="Has receipt">
            receipt
          </span>
        )}
      </div>
    </Link>
  );
}
