import type { Person } from "@/lib/types";

export interface IncomePayload {
  amountCents: unknown;
  entryDate: unknown;
  enteredBy: unknown;
  description?: unknown;
}

export interface ExpensePayload {
  amountCents: unknown;
  entryDate: unknown;
  enteredBy: unknown;
  description: unknown;
  spentBy: unknown;
}

export type ValidationResult =
  | { valid: true; errors: Record<string, never> }
  | { valid: false; errors: Record<string, string> };

const VALID_PERSONS: Person[] = ["landon", "emma"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateAmountCents(
  value: unknown,
  errors: Record<string, string>,
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.amountCents = "Amount is required and must be a number.";
  } else if (!Number.isInteger(value) || value <= 0) {
    errors.amountCents = "Amount must be a positive integer.";
  }
}

function validateEntryDate(
  value: unknown,
  errors: Record<string, string>,
): void {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    errors.entryDate = "Entry date is required and must be YYYY-MM-DD.";
  }
}

function validatePerson(
  field: string,
  value: unknown,
  errors: Record<string, string>,
): void {
  if (
    typeof value !== "string" ||
    !VALID_PERSONS.includes(value as Person)
  ) {
    errors[field] = `${field} must be "landon" or "emma".`;
  }
}

function buildResult(errors: Record<string, string>): ValidationResult {
  if (Object.keys(errors).length === 0) {
    return { valid: true, errors: {} as Record<string, never> };
  }
  return { valid: false, errors };
}

export function validateIncome(payload: IncomePayload): ValidationResult {
  const errors: Record<string, string> = {};

  validateAmountCents(payload.amountCents, errors);
  validateEntryDate(payload.entryDate, errors);
  validatePerson("enteredBy", payload.enteredBy, errors);

  return buildResult(errors);
}

export function validateExpense(payload: ExpensePayload): ValidationResult {
  const errors: Record<string, string> = {};

  validateAmountCents(payload.amountCents, errors);
  validateEntryDate(payload.entryDate, errors);
  validatePerson("enteredBy", payload.enteredBy, errors);

  if (
    typeof payload.description !== "string" ||
    payload.description.trim() === ""
  ) {
    errors.description = "Description is required.";
  }

  validatePerson("spentBy", payload.spentBy, errors);

  return buildResult(errors);
}
