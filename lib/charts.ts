const UNCATEGORIZED_COLOR = "#9CA3AF";
const INCOME_COLOR = "#22C55E";

export function getCategoryChartColor(
  categoryColor: string | null,
  txnType?: "income" | "expense",
): string {
  if (txnType === "income") {
    return INCOME_COLOR;
  }
  return categoryColor || UNCATEGORIZED_COLOR;
}
