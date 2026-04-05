"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { parseMoneyToCents } from "@/lib/money";
import { validateIncome, validateExpense } from "@/lib/validation";
import type { TxnType, Person } from "@/lib/types";
import ReceiptUploader from "@/components/ReceiptUploader";
import CategoryForm from "@/components/CategoryForm";

interface EditData {
  transactionId: Id<"transactions">;
  amountCents: number;
  entryDate: string;
  description: string | null;
  spentBy: Person | null;
  enteredBy: Person;
  receiptFileId?: Id<"_storage"> | null;
  categoryId?: Id<"categories"> | null;
}

interface TransactionFormModalProps {
  mode: TxnType;
  onClose: () => void;
  editData?: EditData;
}

export default function TransactionFormModal({
  mode,
  onClose,
  editData,
}: TransactionFormModalProps) {
  const isEdit = !!editData;

  const [amount, setAmount] = useState(() =>
    editData ? (editData.amountCents / 100).toFixed(2) : "",
  );
  const [entryDate, setEntryDate] = useState(() =>
    editData?.entryDate ?? "",
  );
  const [description, setDescription] = useState(() =>
    editData?.description ?? "",
  );
  const [enteredBy, setEnteredBy] = useState<Person>(() =>
    editData?.enteredBy ?? "landon",
  );
  const [spentBy, setSpentBy] = useState<Person>(() =>
    editData?.spentBy ?? "landon",
  );
  const [receiptFileId, setReceiptFileId] = useState<Id<"_storage"> | null>(null);
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(
    () => editData?.categoryId ?? null,
  );
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useQuery(api.categories.listCategories);

  const createIncome = useMutation(api.transactions.createIncome);
  const createExpense = useMutation(api.transactions.createExpense);
  const editIncomeMutation = useMutation(api.transactions.editIncome);
  const editExpenseMutation = useMutation(api.transactions.editExpense);

  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    let amountCents: number;
    try {
      amountCents = parseMoneyToCents(amount);
    } catch {
      setFieldErrors({ amountCents: "Invalid amount." });
      return;
    }

    const trimmedDesc = description.trim();

    if (mode === "income") {
      const result = validateIncome({
        amountCents,
        entryDate,
        enteredBy,
        description: trimmedDesc || undefined,
      });

      if (!result.valid) {
        setFieldErrors(result.errors);
        return;
      }

      setIsSubmitting(true);
      try {
        if (isEdit) {
          await editIncomeMutation({
            transactionId: editData.transactionId,
            amountCents,
            entryDate,
            enteredBy,
            description: trimmedDesc || null,
          });
        } else {
          await createIncome({
            amountCents,
            entryDate,
            enteredBy,
            description: trimmedDesc || null,
          });
        }
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        setIsSubmitting(false);
      }
    } else {
      const result = validateExpense({
        amountCents,
        entryDate,
        enteredBy,
        description: trimmedDesc,
        spentBy,
      });

      if (!result.valid) {
        setFieldErrors(result.errors);
        return;
      }

      setIsSubmitting(true);
      try {
        if (isEdit) {
          await editExpenseMutation({
            transactionId: editData.transactionId,
            amountCents,
            entryDate,
            enteredBy,
            description: trimmedDesc,
            spentBy,
            categoryId: categoryId ?? null,
            ...(receiptFileId ? { receiptFileId } : {}),
          });
        } else {
          await createExpense({
            amountCents,
            entryDate,
            enteredBy,
            description: trimmedDesc,
            spentBy,
            categoryId: categoryId ?? null,
            ...(receiptFileId ? { receiptFileId } : {}),
          });
        }
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        setIsSubmitting(false);
      }
    }
  }

  const title = isEdit
    ? mode === "income"
      ? "Edit Income"
      : "Edit Expense"
    : mode === "income"
      ? "Add Income"
      : "Add Expense";

  const submitLabel = isEdit
    ? "Save Changes"
    : mode === "income"
      ? "Add Income"
      : "Add Expense";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Amount
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            {fieldErrors.amountCents && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.amountCents}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="entryDate"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Date
            </label>
            <input
              id="entryDate"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            {fieldErrors.entryDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.entryDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description{mode === "income" && " (optional)"}
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="enteredBy"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Entered By
            </label>
            <select
              id="enteredBy"
              value={enteredBy}
              onChange={(e) => setEnteredBy(e.target.value as Person)}
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="landon">Landon</option>
              <option value="emma">Emma</option>
            </select>
            {fieldErrors.enteredBy && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.enteredBy}
              </p>
            )}
          </div>

          {mode === "expense" && (
            <>
              <div>
                <label
                  htmlFor="spentBy"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Spent By
                </label>
                <select
                  id="spentBy"
                  value={spentBy}
                  onChange={(e) => setSpentBy(e.target.value as Person)}
                  className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="landon">Landon</option>
                  <option value="emma">Emma</option>
                </select>
                {fieldErrors.spentBy && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.spentBy}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Category
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    {categoryId && categories && (
                      <span
                        className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
                        style={{
                          backgroundColor: categories.find(
                            (c) => c._id === categoryId,
                          )?.color,
                        }}
                      />
                    )}
                    <select
                      id="category"
                      value={categoryId ?? ""}
                      onChange={(e) =>
                        setCategoryId(
                          e.target.value
                            ? (e.target.value as Id<"categories">)
                            : null,
                        )
                      }
                      className={`w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${categoryId ? "pl-8" : ""}`}
                    >
                      <option value="">Uncategorized</option>
                      {categories?.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.nameDisplay}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickCreate(true)}
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    title="Create new category"
                  >
                    +
                  </button>
                </div>
              </div>
              <ReceiptUploader
                onUploaded={(id) => setReceiptFileId(id)}
                existingReceiptFileId={editData?.receiptFileId}
                disabled={isSubmitting}
              />
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded px-4 py-2 font-medium text-white disabled:opacity-50 ${mode === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </form>
      </div>

      {showQuickCreate && (
        <CategoryForm onClose={() => setShowQuickCreate(false)} />
      )}
    </div>
  );
}
