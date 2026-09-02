import type { Person } from "@/lib/types";

export interface IncomePayload {
  amountCents: number;
  entryDate: string;
  enteredBy: string;
  description?: string;
}

export interface ExpensePayload extends IncomePayload {
  description: string;
  spentBy: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const VALID_PERSONS: string[] = ["landon", "emma"] satisfies Person[];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function baseErrors(p: IncomePayload): Record<string, string> {
  const errors: Record<string, string> = {};
  if (typeof p.amountCents !== "number" || !Number.isFinite(p.amountCents)) {
    errors.amountCents = "Amount is required and must be a number.";
  } else if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) {
    errors.amountCents = "Amount must be a positive integer.";
  }
  if (typeof p.entryDate !== "string" || !DATE_REGEX.test(p.entryDate)) {
    errors.entryDate = "Entry date is required and must be YYYY-MM-DD.";
  }
  if (!VALID_PERSONS.includes(p.enteredBy)) {
    errors.enteredBy = 'enteredBy must be "landon" or "emma".';
  }
  return errors;
}

export function validateIncome(payload: IncomePayload): ValidationResult {
  const errors = baseErrors(payload);
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateExpense(payload: ExpensePayload): ValidationResult {
  const errors = baseErrors(payload);
  if (typeof payload.description !== "string" || payload.description.trim() === "") {
    errors.description = "Description is required.";
  }
  if (!VALID_PERSONS.includes(payload.spentBy)) {
    errors.spentBy = 'spentBy must be "landon" or "emma".';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
