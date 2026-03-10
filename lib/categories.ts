const MAX_NAME_LENGTH = 30;
const MAX_WORD_COUNT = 3;

export function collapseSpaces(input: string): string {
  return input.replace(/\s+/g, " ");
}

export function normalizeCategoryName(input: string): string {
  return collapseSpaces(input.trim()).toLowerCase();
}

export function sanitizeCategoryDisplayName(input: string): string {
  return collapseSpaces(input.trim());
}

export function validateCategoryName(name: string): {
  valid: boolean;
  error?: string;
} {
  const sanitized = sanitizeCategoryDisplayName(name);

  if (sanitized.length === 0) {
    return { valid: false, error: "Name is required." };
  }

  if (sanitized.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const words = sanitized.split(" ").filter((w) => w.length > 0);
  if (words.length > MAX_WORD_COUNT) {
    return {
      valid: false,
      error: `Name must be ${MAX_WORD_COUNT} words or fewer.`,
    };
  }

  return { valid: true };
}
