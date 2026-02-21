export function formatCents(cents: number): string {
  if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
    throw new Error(`Invalid cents value: ${cents}. Must be a finite integer.`);
  }

  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const formatted = `$${dollars}.${String(remainder).padStart(2, "0")}`;

  return negative ? `-${formatted}` : formatted;
}

export function parseMoneyToCents(input: string): number {
  const trimmed = input.trim();

  if (trimmed === "" || trimmed === "$" || trimmed === ".") {
    throw new Error(`Invalid money input: "${input}".`);
  }

  const stripped = trimmed.startsWith("$") ? trimmed.slice(1) : trimmed;

  if (stripped === "" || stripped === ".") {
    throw new Error(`Invalid money input: "${input}".`);
  }

  if (!/^-?\d*\.?\d{0,2}$/.test(stripped)) {
    throw new Error(`Invalid money input: "${input}".`);
  }

  const value = parseFloat(stripped);

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid money input: "${input}".`);
  }

  return Math.round(value * 100);
}
