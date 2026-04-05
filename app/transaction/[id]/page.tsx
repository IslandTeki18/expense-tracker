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
import CategoryBadge from "@/components/CategoryBadge";

function formatPersonLabel(person: "landon" | "emma"): string {
  return person === "landon" ? "Landon" : "Emma";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const categories = useQuery(
    api.categories.listCategories,
    isUnlocked ? {} : "skip",
  );

  const receiptUrl = useQuery(
    api.transactions.getReceiptUrl,
    isUnlocked && transaction?.receiptFileId
      ? { storageId: transaction.receiptFileId }
      : "skip",
  );

  const replaceReceiptMutation = useMutation(api.transactions.replaceReceipt);
  const deleteTransactionMutation = useMutation(api.transactions.deleteTransaction);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTransactionMutation({ transactionId });
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete transaction");
      setIsDeleting(false);
    }
  }

  if (authLoading || !isUnlocked) return null;

  const isLoading = transaction === undefined || history === undefined;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </main>
    );
  }

  if (transaction === null) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">Transaction not found.</p>
          </div>
        </div>
      </main>
    );
  }

  const isIncome = transaction.type === "income";

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isIncome
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {isIncome ? "Income" : "Expense"}
          </span>
          <span
            className={`text-2xl font-bold ${
              isIncome ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCents(transaction.amountCents)}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-300">
              Are you sure? This will permanently delete this transaction and all
              its history.
            </p>
            {deleteError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <dl className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Entry Date</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {transaction.entryDate ?? "--"}
              </dd>
            </div>

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {transaction.description ?? "--"}
              </dd>
            </div>

            {transaction.type === "expense" && (
              <div className="flex justify-between px-4 py-3">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Spent By</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {transaction.spentBy
                    ? formatPersonLabel(transaction.spentBy)
                    : "--"}
                </dd>
              </div>
            )}

            {transaction.type === "expense" && (
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Category</dt>
                <dd>
                  <CategoryBadge
                    txnType="expense"
                    categoryName={
                      transaction.categoryId && categories
                        ? (categories.find((c) => c._id === transaction.categoryId)
                            ?.nameDisplay ?? null)
                        : null
                    }
                    categoryColor={
                      transaction.categoryId && categories
                        ? (categories.find((c) => c._id === transaction.categoryId)
                            ?.color ?? null)
                        : null
                    }
                  />
                </dd>
              </div>
            )}

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Entered By</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatPersonLabel(transaction.enteredBy)}
              </dd>
            </div>

            {transaction.type === "expense" && (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Receipt</dt>
                  <dd className="text-sm font-medium">
                    {transaction.receiptFileId && receiptUrl ? (
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Receipt
                      </a>
                    ) : transaction.receiptFileId ? (
                      <span className="text-gray-400 dark:text-gray-500">Loading...</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">None</span>
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
              <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="text-sm text-gray-700 dark:text-gray-300">
                {formatTimestamp(transaction.createdAt)}
              </dd>
            </div>

            <div className="flex justify-between px-4 py-3">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="text-sm text-gray-700 dark:text-gray-300">
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
            categoryId: transaction.categoryId,
          }}
        />
      )}
    </main>
  );
}
