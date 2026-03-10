"use client";

export interface CategoryBadgeProps {
  txnType: "income" | "expense";
  categoryName: string | null;
  categoryColor: string | null;
  onClick?: () => void;
}

export default function CategoryBadge({
  txnType,
  categoryName,
  categoryColor,
  onClick,
}: CategoryBadgeProps) {
  if (txnType === "income") {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400${onClick ? " cursor-pointer hover:opacity-80" : ""}`}
      >
        Income
      </span>
    );
  }

  if (!categoryName) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300${onClick ? " cursor-pointer hover:opacity-80" : ""}`}
      >
        Other
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium${onClick ? " cursor-pointer hover:opacity-80" : ""}`}
      style={{
        backgroundColor: `${categoryColor}20`,
        color: categoryColor ?? undefined,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: categoryColor ?? undefined }}
      />
      {categoryName}
    </span>
  );
}
