"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateCategoryName, sanitizeCategoryDisplayName } from "@/lib/categories";

interface EditData {
  storeId: Id<"grocery_stores">;
  nameDisplay: string;
  color: string;
}

interface GroceryStoreFormProps {
  onClose: () => void;
  editData?: EditData;
}

export default function GroceryStoreForm({ onClose, editData }: GroceryStoreFormProps) {
  const isEdit = !!editData;
  const [name, setName] = useState(() => editData?.nameDisplay ?? "");
  const [color, setColor] = useState(() => editData?.color ?? "#3B82F6");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createStore = useMutation(api.groceryStores.createStore);
  const updateStore = useMutation(api.groceryStores.updateStore);

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

    const sanitized = sanitizeCategoryDisplayName(name);
    const validation = validateCategoryName(sanitized);
    if (!validation.valid) {
      setFieldErrors({ name: validation.error! });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateStore({
          storeId: editData.storeId,
          nameDisplay: sanitized,
          color,
        });
      } else {
        await createStore({
          nameDisplay: sanitized,
          color,
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? "Edit Store" : "New Store"}
          </h2>
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
              htmlFor="storeName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name
            </label>
            <input
              id="storeName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Costco"
              className="w-full rounded border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="storeColor"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="storeColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {color.toUpperCase()}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Store"}
          </button>
        </form>
      </div>
    </div>
  );
}
