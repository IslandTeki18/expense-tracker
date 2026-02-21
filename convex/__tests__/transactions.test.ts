import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

describe("createIncome", () => {
  it("creates container + version and sets activeVersionId", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createIncome, {
      amountCents: 500000,
      entryDate: "2026-01-15",
      enteredBy: "you",
    });

    const txn = await t.run(async (ctx) => ctx.db.get(txnId));
    expect(txn).not.toBeNull();
    expect(txn!.type).toBe("income");
    expect(txn!.activeVersionId).not.toBeNull();
    expect(txn!.createdBy).toBe("you");

    const version = await t.run(async (ctx) =>
      ctx.db.get(txn!.activeVersionId!),
    );
    expect(version).not.toBeNull();
    expect(version!.amountCents).toBe(500000);
    expect(version!.entryDate).toBe("2026-01-15");
    expect(version!.enteredBy).toBe("you");
    expect(version!.spentBy).toBeNull();
    expect(version!.receiptFileId).toBeNull();
    expect(version!.supersedesVersionId).toBeNull();
  });

  it("stores optional description", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createIncome, {
      amountCents: 100000,
      entryDate: "2026-02-01",
      enteredBy: "wife",
      description: "Paycheck",
    });

    const txn = await t.run(async (ctx) => ctx.db.get(txnId));
    const version = await t.run(async (ctx) =>
      ctx.db.get(txn!.activeVersionId!),
    );
    expect(version!.description).toBe("Paycheck");
  });

  it("rejects amountCents <= 0", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.transactions.createIncome, {
        amountCents: 0,
        entryDate: "2026-01-15",
        enteredBy: "you",
      }),
    ).rejects.toThrow("amountCents must be a positive integer");

    await expect(
      t.mutation(api.transactions.createIncome, {
        amountCents: -100,
        entryDate: "2026-01-15",
        enteredBy: "you",
      }),
    ).rejects.toThrow("amountCents must be a positive integer");
  });

  it("rejects non-integer amountCents", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.transactions.createIncome, {
        amountCents: 99.5,
        entryDate: "2026-01-15",
        enteredBy: "you",
      }),
    ).rejects.toThrow("amountCents must be a positive integer");
  });

  it("rejects invalid date format", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.transactions.createIncome, {
        amountCents: 1000,
        entryDate: "01/15/2026",
        enteredBy: "you",
      }),
    ).rejects.toThrow("entryDate must be in YYYY-MM-DD format");
  });
});

describe("createExpense", () => {
  it("creates container + version and sets activeVersionId", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createExpense, {
      amountCents: 2500,
      entryDate: "2026-01-20",
      description: "Groceries",
      spentBy: "wife",
      enteredBy: "you",
    });

    const txn = await t.run(async (ctx) => ctx.db.get(txnId));
    expect(txn).not.toBeNull();
    expect(txn!.type).toBe("expense");
    expect(txn!.activeVersionId).not.toBeNull();

    const version = await t.run(async (ctx) =>
      ctx.db.get(txn!.activeVersionId!),
    );
    expect(version!.amountCents).toBe(2500);
    expect(version!.description).toBe("Groceries");
    expect(version!.spentBy).toBe("wife");
    expect(version!.enteredBy).toBe("you");
  });

  it("rejects empty description", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.transactions.createExpense, {
        amountCents: 1000,
        entryDate: "2026-01-20",
        description: "   ",
        spentBy: "you",
        enteredBy: "you",
      }),
    ).rejects.toThrow("description must not be empty");
  });

  it("rejects amountCents <= 0", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.transactions.createExpense, {
        amountCents: 0,
        entryDate: "2026-01-20",
        description: "Test",
        spentBy: "you",
        enteredBy: "you",
      }),
    ).rejects.toThrow("amountCents must be a positive integer");
  });
});

describe("editExpense", () => {
  it("creates new version and updates activeVersionId", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createExpense, {
      amountCents: 2500,
      entryDate: "2026-01-20",
      description: "Groceries",
      spentBy: "wife",
      enteredBy: "you",
    });

    const txnBefore = await t.run(async (ctx) => ctx.db.get(txnId));
    const oldVersionId = txnBefore!.activeVersionId!;

    await t.mutation(api.transactions.editExpense, {
      transactionId: txnId,
      amountCents: 3000,
      entryDate: "2026-01-21",
      description: "Groceries (corrected)",
      spentBy: "wife",
      enteredBy: "you",
    });

    const txnAfter = await t.run(async (ctx) => ctx.db.get(txnId));
    expect(txnAfter!.activeVersionId).not.toBe(oldVersionId);

    const newVersion = await t.run(async (ctx) =>
      ctx.db.get(txnAfter!.activeVersionId!),
    );
    expect(newVersion!.amountCents).toBe(3000);
    expect(newVersion!.description).toBe("Groceries (corrected)");
    expect(newVersion!.supersedesVersionId).toBe(oldVersionId);

    // Old version still exists
    const oldVersion = await t.run(async (ctx) => ctx.db.get(oldVersionId));
    expect(oldVersion).not.toBeNull();
    expect(oldVersion!.amountCents).toBe(2500);
  });

  it("carries forward receipt when not explicitly changed", async () => {
    const t = convexTest(schema, modules);

    // Create a fake storage ID by inserting directly
    const fakeReceiptId = await t.run(async (ctx) => {
      const txnId = await ctx.db.insert("transactions", {
        type: "expense",
        activeVersionId: null,
        createdAt: Date.now(),
        createdBy: "you",
        updatedAt: Date.now(),
      });
      const versionId = await ctx.db.insert("transaction_versions", {
        transactionId: txnId,
        type: "expense",
        amountCents: 1000,
        entryDate: "2026-01-20",
        description: "With receipt",
        spentBy: "you",
        enteredBy: "you",
        receiptFileId: null,
        createdAt: Date.now(),
        supersedesVersionId: null,
      });
      await ctx.db.patch(txnId, { activeVersionId: versionId });
      return { txnId, versionId };
    });

    // Edit without providing receiptFileId - should carry forward null
    await t.mutation(api.transactions.editExpense, {
      transactionId: fakeReceiptId.txnId,
      amountCents: 2000,
      entryDate: "2026-01-21",
      description: "Updated",
      spentBy: "you",
      enteredBy: "you",
    });

    const txn = await t.run(async (ctx) =>
      ctx.db.get(fakeReceiptId.txnId),
    );
    const version = await t.run(async (ctx) =>
      ctx.db.get(txn!.activeVersionId!),
    );
    expect(version!.receiptFileId).toBeNull();
  });

  it("rejects editing income as expense", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createIncome, {
      amountCents: 5000,
      entryDate: "2026-01-15",
      enteredBy: "you",
    });

    await expect(
      t.mutation(api.transactions.editExpense, {
        transactionId: txnId,
        amountCents: 3000,
        entryDate: "2026-01-21",
        description: "Wrong type",
        spentBy: "you",
        enteredBy: "you",
      }),
    ).rejects.toThrow("Cannot edit income as expense");
  });
});

describe("editIncome", () => {
  it("creates new version and updates activeVersionId", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createIncome, {
      amountCents: 100000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });

    const txnBefore = await t.run(async (ctx) => ctx.db.get(txnId));
    const oldVersionId = txnBefore!.activeVersionId!;

    await t.mutation(api.transactions.editIncome, {
      transactionId: txnId,
      amountCents: 120000,
      entryDate: "2026-01-02",
      enteredBy: "you",
    });

    const txnAfter = await t.run(async (ctx) => ctx.db.get(txnId));
    expect(txnAfter!.activeVersionId).not.toBe(oldVersionId);

    const newVersion = await t.run(async (ctx) =>
      ctx.db.get(txnAfter!.activeVersionId!),
    );
    expect(newVersion!.amountCents).toBe(120000);
    expect(newVersion!.supersedesVersionId).toBe(oldVersionId);
  });
});

describe("listTransactionHistory", () => {
  it("returns all versions after edits in descending order", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createExpense, {
      amountCents: 1000,
      entryDate: "2026-01-10",
      description: "v1",
      spentBy: "you",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.editExpense, {
      transactionId: txnId,
      amountCents: 2000,
      entryDate: "2026-01-11",
      description: "v2",
      spentBy: "you",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.editExpense, {
      transactionId: txnId,
      amountCents: 3000,
      entryDate: "2026-01-12",
      description: "v3",
      spentBy: "you",
      enteredBy: "you",
    });

    const history = await t.query(api.transactions.listTransactionHistory, {
      transactionId: txnId,
    });

    expect(history).toHaveLength(3);
    // Descending order: newest first
    expect(history[0].description).toBe("v3");
    expect(history[1].description).toBe("v2");
    expect(history[2].description).toBe("v1");
  });
});

describe("deleteTransaction", () => {
  it("removes container and all versions", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createExpense, {
      amountCents: 5000,
      entryDate: "2026-01-20",
      description: "To delete",
      spentBy: "you",
      enteredBy: "you",
    });

    // Edit to create a second version
    await t.mutation(api.transactions.editExpense, {
      transactionId: txnId,
      amountCents: 6000,
      entryDate: "2026-01-21",
      description: "Edited before delete",
      spentBy: "you",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.deleteTransaction, {
      transactionId: txnId,
    });

    const txn = await t.run(async (ctx) => ctx.db.get(txnId));
    expect(txn).toBeNull();

    const versions = await t.run(async (ctx) =>
      ctx.db.query("transaction_versions").collect(),
    );
    expect(versions).toHaveLength(0);
  });

  it("throws when transaction not found", async () => {
    const t = convexTest(schema, modules);
    // Create and delete to get a valid-format but nonexistent ID
    const txnId = await t.mutation(api.transactions.createIncome, {
      amountCents: 1000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });
    await t.mutation(api.transactions.deleteTransaction, {
      transactionId: txnId,
    });

    await expect(
      t.mutation(api.transactions.deleteTransaction, {
        transactionId: txnId,
      }),
    ).rejects.toThrow("Transaction not found");
  });
});

describe("getBalance", () => {
  it("returns 0 when no transactions", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.transactions.getBalance, {});
    expect(result).toEqual({ balanceCents: 0 });
  });

  it("computes income - expense from active versions only", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.transactions.createIncome, {
      amountCents: 500000,
      entryDate: "2026-01-15",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.createExpense, {
      amountCents: 12000,
      entryDate: "2026-01-16",
      description: "Groceries",
      spentBy: "wife",
      enteredBy: "you",
    });

    const result = await t.query(api.transactions.getBalance, {});
    expect(result).toEqual({ balanceCents: 500000 - 12000 });
  });

  it("uses active version amount after edit", async () => {
    const t = convexTest(schema, modules);

    const incomeId = await t.mutation(api.transactions.createIncome, {
      amountCents: 100000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });

    // Edit income to a different amount
    await t.mutation(api.transactions.editIncome, {
      transactionId: incomeId,
      amountCents: 150000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });

    const result = await t.query(api.transactions.getBalance, {});
    // Should reflect the edited (active) amount, not the original
    expect(result).toEqual({ balanceCents: 150000 });
  });

  it("excludes deleted transactions from balance", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.transactions.createIncome, {
      amountCents: 100000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });

    const expenseId = await t.mutation(api.transactions.createExpense, {
      amountCents: 5000,
      entryDate: "2026-01-02",
      description: "To delete",
      spentBy: "you",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.deleteTransaction, {
      transactionId: expenseId,
    });

    const result = await t.query(api.transactions.getBalance, {});
    expect(result).toEqual({ balanceCents: 100000 });
  });
});

describe("listTransactions", () => {
  it("returns transactions newest-first by createdAt", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.transactions.createIncome, {
      amountCents: 100000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.createExpense, {
      amountCents: 5000,
      entryDate: "2026-01-02",
      description: "Lunch",
      spentBy: "wife",
      enteredBy: "you",
    });

    const results = await t.query(api.transactions.listTransactions, {
      limit: 10,
    });

    expect(results).toHaveLength(2);
    expect(results[0].type).toBe("expense");
    expect(results[1].type).toBe("income");
  });

  it("respects limit parameter", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.transactions.createIncome, {
      amountCents: 100000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });

    await t.mutation(api.transactions.createExpense, {
      amountCents: 5000,
      entryDate: "2026-01-02",
      description: "Lunch",
      spentBy: "you",
      enteredBy: "you",
    });

    const results = await t.query(api.transactions.listTransactions, {
      limit: 1,
    });

    expect(results).toHaveLength(1);
  });
});

describe("getTransaction", () => {
  it("returns active version data for a transaction", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createExpense, {
      amountCents: 7500,
      entryDate: "2026-02-10",
      description: "Dinner",
      spentBy: "you",
      enteredBy: "wife",
    });

    const result = await t.query(api.transactions.getTransaction, {
      transactionId: txnId,
    });

    expect(result).not.toBeNull();
    expect(result!.amountCents).toBe(7500);
    expect(result!.description).toBe("Dinner");
    expect(result!.spentBy).toBe("you");
    expect(result!.enteredBy).toBe("wife");
    expect(result!.type).toBe("expense");
  });

  it("returns null for deleted transaction", async () => {
    const t = convexTest(schema, modules);
    const txnId = await t.mutation(api.transactions.createIncome, {
      amountCents: 1000,
      entryDate: "2026-01-01",
      enteredBy: "you",
    });
    await t.mutation(api.transactions.deleteTransaction, {
      transactionId: txnId,
    });

    const result = await t.query(api.transactions.getTransaction, {
      transactionId: txnId,
    });
    expect(result).toBeNull();
  });
});
