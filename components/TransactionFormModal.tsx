"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { parseMoneyToCents } from "@/lib/money";
import { validateIncome } from "@/lib/validation";
import type { TxnType, Person } from "@/lib/types";

interface TransactionFormModalProps {
  mode: TxnType;
  onClose: () => void;
}

export default function TransactionFormModal({
  mode,
  onClose,
}: TransactionFormModalProps) {
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [description, setDescription] = useState("");
  const [enteredBy, setEnteredBy] = useState<Person>("you");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createIncome = useMutation(api.transactions.createIncome);

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
        await createIncome({
          amountCents,
          entryDate,
          enteredBy,
          description: trimmedDesc || null,
        });
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "income" ? "Add Income" : "Add Expense"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="mb-1 block text-sm font-medium text-gray-700"
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
              className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.amountCents && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.amountCents}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="entryDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              id="entryDate"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.entryDate && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.entryDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description{mode === "income" && " (optional)"}
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="enteredBy"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Entered By
            </label>
            <select
              id="enteredBy"
              value={enteredBy}
              onChange={(e) => setEnteredBy(e.target.value as Person)}
              className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="you">You</option>
              <option value="wife">Wife</option>
            </select>
            {fieldErrors.enteredBy && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.enteredBy}
              </p>
            )}
          </div>

          {mode === "expense" && (
            <>
              {/* Expense-only fields: spentBy, receipt upload (Task 9) */}
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : mode === "income"
                ? "Add Income"
                : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
