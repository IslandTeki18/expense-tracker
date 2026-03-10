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

  return (
    <Link
      href={`/transaction/${txn._id}`}
      className="flex cursor-pointer flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50 sm:flex-nowrap sm:gap-4 dark:border-gray-800 dark:hover:bg-gray-800"
    >
      <span
        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium sm:w-18 sm:shrink-0 ${
          isIncome
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {isIncome ? "Income" : "Expense"}
      </span>

      <span
        className={`text-right text-sm font-semibold sm:w-24 sm:shrink-0 ${
          isIncome ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatCents(txn.amountCents)}
      </span>

      <span className="text-sm text-gray-500 sm:w-24 sm:shrink-0 dark:text-gray-400">
        {txn.entryDate ? (
          <>
            <span className="sm:hidden">{formatDateShort(txn.entryDate)}</span>
            <span className="hidden sm:inline">{txn.entryDate}</span>
          </>
        ) : (
          "--"
        )}
      </span>

      <span className="min-w-0 w-full flex-1 truncate text-sm text-gray-900 sm:w-auto dark:text-gray-100">
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
    </Link>
  );
}
