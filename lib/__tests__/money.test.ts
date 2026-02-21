import { describe, expect, it } from "vitest";
import { formatCents, parseMoneyToCents } from "@/lib/money";

describe("formatCents", () => {
  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats positive cents", () => {
    expect(formatCents(123)).toBe("$1.23");
  });

  it("formats single-digit cents with padding", () => {
    expect(formatCents(1)).toBe("$0.01");
    expect(formatCents(9)).toBe("$0.09");
  });

  it("formats large values", () => {
    expect(formatCents(100000)).toBe("$1000.00");
  });

  it("formats negative cents", () => {
    expect(formatCents(-123)).toBe("-$1.23");
  });

  it("formats negative zero as $0.00", () => {
    expect(formatCents(-0)).toBe("$0.00");
  });

  it("throws on NaN", () => {
    expect(() => formatCents(NaN)).toThrow();
  });

  it("throws on Infinity", () => {
    expect(() => formatCents(Infinity)).toThrow();
    expect(() => formatCents(-Infinity)).toThrow();
  });

  it("throws on non-integer", () => {
    expect(() => formatCents(1.5)).toThrow();
  });
});

describe("parseMoneyToCents", () => {
  it("parses dollar string with $", () => {
    expect(parseMoneyToCents("$1.23")).toBe(123);
  });

  it("parses without $", () => {
    expect(parseMoneyToCents("1.23")).toBe(123);
  });

  it("parses whole dollars", () => {
    expect(parseMoneyToCents("1")).toBe(100);
    expect(parseMoneyToCents("$1")).toBe(100);
  });

  it("parses single cent", () => {
    expect(parseMoneyToCents("0.01")).toBe(1);
  });

  it("parses leading decimal", () => {
    expect(parseMoneyToCents(".99")).toBe(99);
  });

  it("parses zero", () => {
    expect(parseMoneyToCents("0")).toBe(0);
    expect(parseMoneyToCents("0.00")).toBe(0);
  });

  it("parses negative values", () => {
    expect(parseMoneyToCents("-1.23")).toBe(-123);
  });

  it("trims whitespace", () => {
    expect(parseMoneyToCents("  $1.23  ")).toBe(123);
  });

  it("rejects empty string", () => {
    expect(() => parseMoneyToCents("")).toThrow();
  });

  it("rejects whitespace-only", () => {
    expect(() => parseMoneyToCents("   ")).toThrow();
  });

  it("rejects $ only", () => {
    expect(() => parseMoneyToCents("$")).toThrow();
  });

  it("rejects . only", () => {
    expect(() => parseMoneyToCents(".")).toThrow();
  });

  it("rejects letters", () => {
    expect(() => parseMoneyToCents("abc")).toThrow();
    expect(() => parseMoneyToCents("$abc")).toThrow();
  });

  it("rejects multiple decimals", () => {
    expect(() => parseMoneyToCents("1.2.3")).toThrow();
  });

  it("rejects more than 2 decimal places", () => {
    expect(() => parseMoneyToCents("1.234")).toThrow();
  });
});
