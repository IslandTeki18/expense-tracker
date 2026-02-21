import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBalance = query({
  args: {},
  returns: v.object({ balanceCents: v.number() }),
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    let balanceCents = 0;
    for (const txn of transactions) {
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
    if (!txn) return null;
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
