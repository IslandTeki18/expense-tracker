"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { ImagePlus, Paperclip } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ReceiptUploaderProps {
  onUploaded: (storageId: Id<"_storage">) => void | Promise<void>;
  /** Whether a receipt is already attached (shows the "has receipt" slot). */
  hasReceipt: boolean;
  /** Signed URL of the current receipt; renders a preview when it is an image. */
  previewUrl?: string | null;
  disabled?: boolean;
}

/** Receipt slot: tap to pick a file, uploads straight to Convex storage. */
export default function ReceiptUploader({ onUploaded, hasReceipt, previewUrl, disabled }: ReceiptUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await onUploaded(storageId as Id<"_storage">);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        className="gt-receipt"
        data-has={hasReceipt ? "1" : "0"}
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {hasReceipt ? (
          <>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Receipt" className="gt-receipt-img" />
            ) : (
              <div className="gt-receipt-lines">
                {[92, 60, 78, 45, 70, 88, 52, 66].map((w, i) => (
                  <span key={i} style={{ width: `${w}%` }} />
                ))}
              </div>
            )}
            <span className="gt-receipt-tag">
              <Paperclip size={12} /> {isUploading ? "UPLOADING" : "REPLACE"}
            </span>
          </>
        ) : (
          <div className="gt-receipt-empty">
            <ImagePlus size={18} />
            <span>{isUploading ? "Uploading…" : "Add receipt"}</span>
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        hidden
      />
      {previewUrl && (
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="gt-field-hint" style={{ color: "var(--accent)" }}>
          Open full size
        </a>
      )}
      {error && <span className="gt-field-err">{error}</span>}
    </div>
  );
}
