import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertPositiveCents(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amountCents must be a positive integer");
  }
}

function assertValidDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("entryDate must be in YYYY-MM-DD format");
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}

export const getBalance = query({
  args: {},
  returns: v.object({ balanceCents: v.number() }),
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    let balanceCents = 0;
    for (const txn of transactions) {
      if (!txn.activeVersionId) continue;
      const version = await ctx.db.get(txn.activeVersionId);
      if (!version) continue;
      if (txn.type === "income") {
        balanceCents += version.amountCents;
      } else {
        balanceCents -= version.amountCents;
      }
    }
    return { balanceCents };
  },
});

export const listTransactions = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);

    const results = [];
    for (const txn of transactions) {
      if (!txn.activeVersionId) continue;
      const version = await ctx.db.get(txn.activeVersionId);
      if (!version) continue;
      results.push({
        _id: txn._id,
        type: txn.type,
        createdAt: txn.createdAt,
        createdBy: txn.createdBy,
        updatedAt: txn.updatedAt,
        amountCents: version.amountCents,
        entryDate: version.entryDate,
        description: version.description,
        spentBy: version.spentBy,
        enteredBy: version.enteredBy,
        receiptFileId: version.receiptFileId,
        versionCreatedAt: version.createdAt,
      });
    }
    return results;
  },
});

export const getTransaction = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const txn = await ctx.db.get(transactionId);
    if (!txn || !txn.activeVersionId) return null;
    const version = await ctx.db.get(txn.activeVersionId);
    if (!version) return null;
    return {
      _id: txn._id,
      type: txn.type,
      createdAt: txn.createdAt,
      createdBy: txn.createdBy,
      updatedAt: txn.updatedAt,
      amountCents: version.amountCents,
      entryDate: version.entryDate,
      description: version.description,
      spentBy: version.spentBy,
      enteredBy: version.enteredBy,
      receiptFileId: version.receiptFileId,
      versionCreatedAt: version.createdAt,
      activeVersionId: txn.activeVersionId,
    };
  },
});

export const listTransactionHistory = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    return await ctx.db
      .query("transaction_versions")
      .withIndex("by_transactionId_createdAt", (q) =>
        q.eq("transactionId", transactionId),
      )
      .order("desc")
      .collect();
  },
});

export const editIncome = mutation({
  args: {
    transactionId: v.id("transactions"),
    amountCents: v.number(),
    entryDate: v.string(),
    enteredBy: v.union(v.literal("you"), v.literal("wife")),
    description: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (
    ctx,
    { transactionId, amountCents, entryDate, enteredBy, description },
  ) => {
    const txn = await ctx.db.get(transactionId);
    if (!txn) throw new Error("Transaction not found");
    if (txn.type !== "income")
      throw new Error("Cannot edit expense as income");

    assertPositiveCents(amountCents);
    assertValidDate(entryDate);

    const oldActiveVersionId = txn.activeVersionId;
    const now = Date.now();

    const newVersionId = await ctx.db.insert("transaction_versions", {
      transactionId,
      type: "income",
      amountCents,
      entryDate,
      description: description ?? null,
      spentBy: null,
      enteredBy,
      receiptFileId: null,
      createdAt: now,
      supersedesVersionId: oldActiveVersionId,
    });

    await ctx.db.patch(transactionId, {
      activeVersionId: newVersionId,
      updatedAt: now,
    });

    return newVersionId;
  },
});

export const editExpense = mutation({
  args: {
    transactionId: v.id("transactions"),
    amountCents: v.number(),
    entryDate: v.string(),
    description: v.string(),
    spentBy: v.union(v.literal("you"), v.literal("wife")),
    enteredBy: v.union(v.literal("you"), v.literal("wife")),
    receiptFileId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (
    ctx,
    { transactionId, amountCents, entryDate, description, spentBy, enteredBy, receiptFileId: newReceiptFileId },
  ) => {
    const txn = await ctx.db.get(transactionId);
    if (!txn) throw new Error("Transaction not found");
    if (txn.type !== "expense")
      throw new Error("Cannot edit income as expense");

    assertPositiveCents(amountCents);
    assertValidDate(entryDate);
    assertNonEmpty(description, "description");

    const oldActiveVersionId = txn.activeVersionId;
    const now = Date.now();

    // Determine receiptFileId: use provided value, or carry forward from old version
    let resolvedReceiptFileId = null;
    let oldReceiptFileId = null;
    if (oldActiveVersionId) {
      const oldVersion = await ctx.db.get(oldActiveVersionId);
      if (oldVersion) {
        oldReceiptFileId = oldVersion.receiptFileId;
      }
    }

    if (newReceiptFileId !== undefined) {
      resolvedReceiptFileId = newReceiptFileId;
    } else {
      resolvedReceiptFileId = oldReceiptFileId;
    }

    const newVersionId = await ctx.db.insert("transaction_versions", {
      transactionId,
      type: "expense",
      amountCents,
      entryDate,
      description,
      spentBy,
      enteredBy,
      receiptFileId: resolvedReceiptFileId,
      createdAt: now,
      supersedesVersionId: oldActiveVersionId,
    });

    await ctx.db.patch(transactionId, {
      activeVersionId: newVersionId,
      updatedAt: now,
    });

    // Delete old receipt file if it was replaced
    if (newReceiptFileId !== undefined && oldReceiptFileId && oldReceiptFileId !== newReceiptFileId) {
      await ctx.storage.delete(oldReceiptFileId);
    }

    return newVersionId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getReceiptUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const replaceReceipt = mutation({
  args: {
    transactionId: v.id("transactions"),
    newReceiptFileId: v.id("_storage"),
  },
  handler: async (ctx, { transactionId, newReceiptFileId }) => {
    const txn = await ctx.db.get(transactionId);
    if (!txn) throw new Error("Transaction not found");
    if (txn.type !== "expense")
      throw new Error("Only expenses can have receipts");
    if (!txn.activeVersionId) throw new Error("No active version");

    const oldVersion = await ctx.db.get(txn.activeVersionId);
    if (!oldVersion) throw new Error("Active version not found");

    const now = Date.now();

    const newVersionId = await ctx.db.insert("transaction_versions", {
      transactionId,
      type: "expense",
      amountCents: oldVersion.amountCents,
      entryDate: oldVersion.entryDate,
      description: oldVersion.description,
      spentBy: oldVersion.spentBy,
      enteredBy: oldVersion.enteredBy,
      receiptFileId: newReceiptFileId,
      createdAt: now,
      supersedesVersionId: txn.activeVersionId,
    });

    await ctx.db.patch(transactionId, {
      activeVersionId: newVersionId,
      updatedAt: now,
    });

    if (oldVersion.receiptFileId) {
      await ctx.storage.delete(oldVersion.receiptFileId);
    }

    return newVersionId;
  },
});

export const createIncome = mutation({
  args: {
    amountCents: v.number(),
    entryDate: v.string(),
    enteredBy: v.union(v.literal("you"), v.literal("wife")),
    description: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { amountCents, entryDate, enteredBy, description }) => {
    assertPositiveCents(amountCents);
    assertValidDate(entryDate);

    const now = Date.now();

    const txnId = await ctx.db.insert("transactions", {
      type: "income",
      activeVersionId: null,
      createdAt: now,
      createdBy: enteredBy,
      updatedAt: now,
    });

    const versionId = await ctx.db.insert("transaction_versions", {
      transactionId: txnId,
      type: "income",
      amountCents,
      entryDate,
      description: description ?? null,
      spentBy: null,
      enteredBy,
      receiptFileId: null,
      createdAt: now,
      supersedesVersionId: null,
    });

    await ctx.db.patch(txnId, { activeVersionId: versionId });

    return txnId;
  },
});

export const createExpense = mutation({
  args: {
    amountCents: v.number(),
    entryDate: v.string(),
    description: v.string(),
    spentBy: v.union(v.literal("you"), v.literal("wife")),
    enteredBy: v.union(v.literal("you"), v.literal("wife")),
    receiptFileId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (
    ctx,
    { amountCents, entryDate, description, spentBy, enteredBy, receiptFileId },
  ) => {
    assertPositiveCents(amountCents);
    assertValidDate(entryDate);
    assertNonEmpty(description, "description");

    const now = Date.now();

    const txnId = await ctx.db.insert("transactions", {
      type: "expense",
      activeVersionId: null,
      createdAt: now,
      createdBy: enteredBy,
      updatedAt: now,
    });

    const versionId = await ctx.db.insert("transaction_versions", {
      transactionId: txnId,
      type: "expense",
      amountCents,
      entryDate,
      description,
      spentBy,
      enteredBy,
      receiptFileId: receiptFileId ?? null,
      createdAt: now,
      supersedesVersionId: null,
    });

    await ctx.db.patch(txnId, { activeVersionId: versionId });

    return txnId;
  },
});
