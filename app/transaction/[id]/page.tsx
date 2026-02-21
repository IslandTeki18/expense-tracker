"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/AuthContext";
import { formatCents } from "@/lib/money";
import HistoryPanel from "@/components/HistoryPanel";
import TransactionFormModal from "@/components/TransactionFormModal";
import ReceiptUploader from "@/components/ReceiptUploader";

function formatPersonLabel(person: "you" | "wife"): string {
  return person === "you" ? "You" : "Wife";
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

export default function TransactionDetailPage() {
  const { isUnlocked, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as Id<"transactions">;
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [authLoading, isUnlocked, router]);

  const transaction = useQuery(
    api.transactions.getTransaction,
    isUnlocked ? { transactionId } : "skip",
  );
  const history = useQuery(
    api.transactions.listTransactionHistory,
    isUnlocked ? { transactionId } : "skip",
  );

  const receiptUrl = useQuery(
    api.transactions.getReceiptUrl,
    isUnlocked && transaction?.receiptFileId
      ? { storageId: transaction.receiptFileId }
      : "skip",
  );

  const replaceReceiptMutation = useMutation(api.transactions.replaceReceipt);

  if (authLoading || !isUnlocked) return null;

  const isLoading = transaction === undefined || history === undefined;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="h-40 rounded-lg bg-gray-200" />
            <div className="h-32 rounded-lg bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (transaction === null) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-500">Transaction not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const isIncome = transaction.type === "income";

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isIncome
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isIncome ? "Income" : "Expense"}
          </span>
          <span
            className={`text-2xl font-bold ${
              isIncome ? "text-green-700" : "text-red-700"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCents(transaction.amountCents)}
          </span>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="ml-auto rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <dl className="divide-y divide-gray-100">
            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Entry Date</dt>
              <dd className="text-sm font-medium text-gray-900">
                {transaction.entryDate ?? "--"}
              </dd>
            </div>

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Description</dt>
              <dd className="text-sm font-medium text-gray-900">
                {transaction.description ?? "--"}
              </dd>
            </div>

            {transaction.type === "expense" && (
              <div className="flex justify-between px-4 py-3">
                <dt className="text-sm text-gray-500">Spent By</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {transaction.spentBy
                    ? formatPersonLabel(transaction.spentBy)
                    : "--"}
                </dd>
              </div>
            )}

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Entered By</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatPersonLabel(transaction.enteredBy)}
              </dd>
            </div>

            {transaction.type === "expense" && (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Receipt</dt>
                  <dd className="text-sm font-medium">
                    {transaction.receiptFileId && receiptUrl ? (
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Receipt
                      </a>
                    ) : transaction.receiptFileId ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </dd>
                </div>
                <div className="mt-2">
                  <ReceiptUploader
                    onUploaded={async (storageId) => {
                      await replaceReceiptMutation({
                        transactionId: transaction._id,
                        newReceiptFileId: storageId,
                      });
                    }}
                    existingReceiptFileId={transaction.receiptFileId}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-sm text-gray-700">
                {formatTimestamp(transaction.createdAt)}
              </dd>
            </div>

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-700">
                {formatTimestamp(transaction.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {history && (
          <HistoryPanel
            versions={history}
            activeVersionId={transaction.activeVersionId}
          />
        )}
      </div>

      {showEditModal && (
        <TransactionFormModal
          mode={transaction.type}
          onClose={() => setShowEditModal(false)}
          editData={{
            transactionId: transaction._id,
            amountCents: transaction.amountCents,
            entryDate: transaction.entryDate ?? "",
            description: transaction.description,
            spentBy: transaction.spentBy,
            enteredBy: transaction.enteredBy,
            receiptFileId: transaction.receiptFileId,
          }}
        />
      )}
    </main>
  );
}
