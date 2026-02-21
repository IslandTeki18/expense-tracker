"use client";

import { formatCents } from "@/lib/money";
import { Id } from "@/convex/_generated/dataModel";

export interface TransactionRowData {
  _id: Id<"transactions">;
  type: "income" | "expense";
  createdAt: number;
  createdBy: "you" | "wife";
  updatedAt: number;
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

export default function TransactionRow({ txn }: { txn: TransactionRowData }) {
  const isIncome = txn.type === "income";

  return (
    <div className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0">
      <span
        className={`inline-flex w-18 shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isIncome
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {isIncome ? "Income" : "Expense"}
      </span>

      <span
        className={`w-24 shrink-0 text-right text-sm font-semibold ${
          isIncome ? "text-green-700" : "text-red-700"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatCents(txn.amountCents)}
      </span>

      <span className="w-24 shrink-0 text-sm text-gray-500">
        {txn.entryDate ?? "--"}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
        {txn.description ?? ""}
      </span>

      {txn.type === "expense" && txn.spentBy && (
        <span className="shrink-0 text-xs text-gray-500">
          by {formatPersonLabel(txn.spentBy)}
        </span>
      )}

      <span className="shrink-0 text-xs text-gray-400">
        {formatPersonLabel(txn.enteredBy)}
      </span>

      {txn.receiptFileId && (
        <span className="shrink-0 text-xs text-blue-500" title="Has receipt">
          receipt
        </span>
      )}
    </div>
  );
}
