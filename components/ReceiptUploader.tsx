"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ReceiptUploaderProps {
  onUploaded: (storageId: Id<"_storage">) => void;
  existingReceiptFileId?: Id<"_storage"> | null;
  disabled?: boolean;
}

export default function ReceiptUploader({
  onUploaded,
  existingReceiptFileId,
  disabled,
}: ReceiptUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.transactions.generateUploadUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      setUploaded(true);
      onUploaded(storageId as Id<"_storage">);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const hasReceipt = existingReceiptFileId || uploaded;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Receipt
      </label>
      {hasReceipt && !isUploading && (
        <p className="mb-1 text-sm text-green-600">
          {uploaded ? "New receipt attached" : "Receipt attached"}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="block w-full text-sm text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
      />
      {isUploading && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
