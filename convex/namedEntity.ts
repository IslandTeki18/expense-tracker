// Shared validation for the named-color entities (categories, grocery_stores).
const MAX_NAME_LENGTH = 30;
const MAX_WORD_COUNT = 3;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function normalizeName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

export function sanitizeDisplayName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function assertValidName(name: string, label: string): void {
  const sanitized = sanitizeDisplayName(name);
  if (sanitized.length === 0) {
    throw new Error(`${label} name is required.`);
  }
  if (sanitized.length > MAX_NAME_LENGTH) {
    throw new Error(`${label} name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  const words = sanitized.split(" ").filter((w) => w.length > 0);
  if (words.length > MAX_WORD_COUNT) {
    throw new Error(`${label} name must be ${MAX_WORD_COUNT} words or fewer.`);
  }
}

export function assertValidColor(color: string): void {
  if (!HEX_COLOR_REGEX.test(color)) {
    throw new Error("Color must be a valid hex color (e.g. #FF5733).");
  }
}
