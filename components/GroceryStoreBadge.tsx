"use client";

export interface GroceryStoreBadgeProps {
  storeName: string | null;
  storeColor: string | null;
}

export default function GroceryStoreBadge({
  storeName,
  storeColor,
}: GroceryStoreBadgeProps) {
  if (!storeName) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${storeColor}20`,
        color: storeColor ?? undefined,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: storeColor ?? undefined }}
      />
      {storeName}
    </span>
  );
}
