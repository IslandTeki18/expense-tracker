import type { TxnType } from "@/lib/types";

export function getCategorySortLabel(
  txnType: TxnType,
  categoryName: string | null,
): string {
  if (txnType === "income") {
    return "\uffff_INCOME";
  }
  if (!categoryName) {
    return "\uffff_UNCATEGORIZED";
  }
  return categoryName.toLowerCase();
}
