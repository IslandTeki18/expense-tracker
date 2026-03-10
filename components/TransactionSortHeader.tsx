"use client";

export type SortField = "date" | "amount" | "category";
export type SortDirection = "asc" | "desc";

interface TransactionSortHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortArrow({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) {
    return <span className="ml-1 text-gray-300 dark:text-gray-600">&uarr;&darr;</span>;
  }
  return (
    <span className="ml-1 text-blue-600 dark:text-blue-400">
      {direction === "asc" ? "\u2191" : "\u2193"}
    </span>
  );
}

export default function TransactionSortHeader({
  sortField,
  sortDirection,
  onSort,
}: TransactionSortHeaderProps) {
  const columns: { field: SortField; label: string; className: string }[] = [
    { field: "category", label: "Category", className: "flex-1" },
    { field: "amount", label: "Amount", className: "w-24" },
    { field: "date", label: "Date", className: "w-24" },
  ];

  return (
    <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
      {columns.map((col) => (
        <button
          key={col.field}
          onClick={() => onSort(col.field)}
          className={`flex items-center hover:text-gray-900 dark:hover:text-gray-200 ${col.className}`}
        >
          {col.label}
          <SortArrow active={sortField === col.field} direction={sortDirection} />
        </button>
      ))}
    </div>
  );
}
