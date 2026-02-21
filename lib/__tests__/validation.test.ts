import { describe, expect, it } from "vitest";
import { validateIncome, validateExpense } from "@/lib/validation";

describe("validateIncome", () => {
  const validPayload = {
    amountCents: 500,
    entryDate: "2026-01-15",
    enteredBy: "you",
  };

  it("passes with valid payload", () => {
    const result = validateIncome(validPayload);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("passes with optional description", () => {
    const result = validateIncome({ ...validPayload, description: "Salary" });
    expect(result.valid).toBe(true);
  });

  it("does not require description", () => {
    const result = validateIncome({ ...validPayload, description: undefined });
    expect(result.valid).toBe(true);
  });

  it("does not require spentBy", () => {
    const result = validateIncome(validPayload);
    expect(result.errors).not.toHaveProperty("spentBy");
  });

  it("rejects missing amountCents", () => {
    const result = validateIncome({
      ...validPayload,
      amountCents: undefined as unknown as number,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amountCents");
  });

  it("rejects zero amountCents", () => {
    const result = validateIncome({ ...validPayload, amountCents: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amountCents");
  });

  it("rejects negative amountCents", () => {
    const result = validateIncome({ ...validPayload, amountCents: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amountCents");
  });

  it("rejects non-integer amountCents", () => {
    const result = validateIncome({ ...validPayload, amountCents: 1.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amountCents");
  });

  it("rejects non-number amountCents", () => {
    const result = validateIncome({
      ...validPayload,
      amountCents: "500" as unknown as number,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amountCents");
  });

  it("rejects missing entryDate", () => {
    const result = validateIncome({
      ...validPayload,
      entryDate: undefined as unknown as string,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("entryDate");
  });

  it("rejects invalid entryDate format", () => {
    const result = validateIncome({ ...validPayload, entryDate: "01/15/2026" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("entryDate");
  });

  it("rejects invalid enteredBy", () => {
    const result = validateIncome({ ...validPayload, enteredBy: "bob" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("enteredBy");
  });

  it("rejects missing enteredBy", () => {
    const result = validateIncome({
      ...validPayload,
      enteredBy: undefined as unknown as string,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("enteredBy");
  });

  it("returns multiple errors simultaneously", () => {
    const result = validateIncome({
      amountCents: -1,
      entryDate: "bad",
      enteredBy: "nobody",
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
  });
});

describe("validateExpense", () => {
  const validPayload = {
    amountCents: 500,
    entryDate: "2026-01-15",
    enteredBy: "you",
    description: "Groceries",
    spentBy: "wife",
  };

  it("passes with valid payload", () => {
    const result = validateExpense(validPayload);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("inherits income validation (rejects bad amountCents)", () => {
    const result = validateExpense({ ...validPayload, amountCents: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amountCents");
  });

  it("inherits income validation (rejects bad entryDate)", () => {
    const result = validateExpense({ ...validPayload, entryDate: "nope" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("entryDate");
  });

  it("inherits income validation (rejects bad enteredBy)", () => {
    const result = validateExpense({ ...validPayload, enteredBy: "bob" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("enteredBy");
  });

  it("rejects missing description", () => {
    const result = validateExpense({
      ...validPayload,
      description: undefined as unknown as string,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("description");
  });

  it("rejects empty description", () => {
    const result = validateExpense({ ...validPayload, description: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("description");
  });

  it("rejects whitespace-only description", () => {
    const result = validateExpense({ ...validPayload, description: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("description");
  });

  it("rejects missing spentBy", () => {
    const result = validateExpense({
      ...validPayload,
      spentBy: undefined as unknown as string,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("spentBy");
  });

  it("rejects invalid spentBy", () => {
    const result = validateExpense({ ...validPayload, spentBy: "bob" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("spentBy");
  });

  it("returns multiple errors simultaneously", () => {
    const result = validateExpense({
      amountCents: "bad",
      entryDate: 123,
      enteredBy: null,
      description: "",
      spentBy: "nobody",
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(5);
  });
});
