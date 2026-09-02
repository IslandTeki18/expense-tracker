import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

function assertPositiveCents(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amountCents must be a positive integer");
  }
}

export function assertValidDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("entryDate must be in YYYY-MM-DD format");
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}


// ponytail: whole-table collects + in-memory join. Convex charges per db.get, and the
// old one-get-per-row loop blew the per-query op limit at ~800 transactions.
export async function loadLookups(ctx: QueryCtx) {
  const [versions, categories] = await Promise.all([
    ctx.db.query("transaction_versions").collect(),
    ctx.db.query("categories").collect(),
  ]);
  return {
    versionById: new Map(versions.map((v) => [v._id, v])),
    categoryById: new Map(categories.map((c) => [c._id, c])),
  };
}

const SPARK_POINTS = 24;

export const getBalance = query({
  args: {},
  returns: v.object({
    balanceCents: v.number(),
    totalIncome: v.number(),
    totalExpenses: v.number(),
    count: v.number(),
    series: v.array(v.number()),
  }),
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    const { versionById } = await loadLookups(ctx);
    const events: { date: string; createdAt: number; delta: number }[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const txn of transactions) {
      if (!txn.activeVersionId) continue;
      const version = versionById.get(txn.activeVersionId);
      if (!version) continue;
      const signed = txn.type === "income" ? version.amountCents : -version.amountCents;
      if (txn.type === "income") totalIncome += version.amountCents;
      else totalExpenses += version.amountCents;
      events.push({ date: version.entryDate ?? "", createdAt: txn.createdAt, delta: signed });
    }
    // Running balance ordered by entry date, sampled to SPARK_POINTS for the hero sparkline.
    events.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    let run = 0;
    const points = events.map((e) => (run += e.delta));
    const step = Math.max(1, Math.floor(points.length / SPARK_POINTS));
    const series = points.filter((_, i) => i % step === 0);
    return {
      balanceCents: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      count: events.length,
      series,
    };
  },
});

const DEFAULT_PAGE_SIZE = 25;

export const listTransactions = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    sortField: v.optional(v.union(v.literal("date"), v.literal("amount"))),
    categoryFilter: v.optional(
      v.union(v.id("categories"), v.literal("uncategorized"), v.null()),
    ),
    typeFilter: v.optional(
      v.union(v.literal("income"), v.literal("expense"), v.null()),
    ),
  },
  handler: async (ctx, args) => {
    const page = args.page && args.page >= 1 ? Math.floor(args.page) : 1;
    const pageSize = args.pageSize && args.pageSize >= 1
      ? Math.floor(args.pageSize)
      : DEFAULT_PAGE_SIZE;
    const sortField = args.sortField ?? "date";

    const allTransactions = await ctx.db.query("transactions").collect();
    const { versionById, categoryById } = await loadLookups(ctx);

    // Build enriched rows with version + category data
    const rows = [];
    for (const txn of allTransactions) {
      if (!txn.activeVersionId) continue;
      const version = versionById.get(txn.activeVersionId);
      if (!version) continue;

      let categoryName: string | null = null;
      let categoryColor: string | null = null;
      if (txn.categoryId) {
        const cat = categoryById.get(txn.categoryId);
        if (cat) {
          categoryName = cat.nameDisplay;
          categoryColor = cat.color;
        }
      }

      rows.push({
        _id: txn._id,
        type: txn.type,
        createdAt: txn.createdAt,
        createdBy: txn.createdBy,
        updatedAt: txn.updatedAt,
        categoryId: txn.categoryId ?? null,
        categoryName,
        categoryColor,
        amountCents: version.amountCents,
        entryDate: version.entryDate,
        description: version.description,
        spentBy: version.spentBy,
        enteredBy: version.enteredBy,
        receiptFileId: version.receiptFileId,
        versionCreatedAt: version.createdAt,
      });
    }

    // Filter by date range
    let filtered = rows;

    // Filter by type
    if (args.typeFilter) {
      filtered = filtered.filter((r) => r.type === args.typeFilter);
    }

    // Filter by category
    if (args.categoryFilter === "uncategorized") {
      filtered = filtered.filter((r) => r.type === "expense" && !r.categoryId);
    } else if (args.categoryFilter != null) {
      filtered = filtered.filter((r) => r.categoryId === args.categoryFilter);
    }

    // Sort desc by field, newest-created first on ties
    filtered.sort((a, b) => {
      const cmp =
        sortField === "date"
          ? (b.entryDate ?? "").localeCompare(a.entryDate ?? "")
          : b.amountCents - a.amountCents;
      return cmp || b.createdAt - a.createdAt;
    });

    // Paginate
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;
    const paged = filtered.slice(offset, offset + pageSize);

    return {
      transactions: paged,
      totalCount,
      totalPages,
      page,
      pageSize,
    };
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
      categoryId: txn.categoryId ?? null,
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
    enteredBy: v.union(v.literal("landon"), v.literal("emma")),
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
    spentBy: v.union(v.literal("landon"), v.literal("emma")),
    enteredBy: v.union(v.literal("landon"), v.literal("emma")),
    receiptFileId: v.optional(v.union(v.id("_storage"), v.null())),
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
  },
  handler: async (
    ctx,
    { transactionId, amountCents, entryDate, description, spentBy, enteredBy, receiptFileId: newReceiptFileId, categoryId },
  ) => {
    const txn = await ctx.db.get(transactionId);
    if (!txn) throw new Error("Transaction not found");
    if (txn.type !== "expense")
      throw new Error("Cannot edit income as expense");

    assertPositiveCents(amountCents);
    assertValidDate(entryDate);
    assertNonEmpty(description, "description");

    if (categoryId) {
      const category = await ctx.db.get(categoryId);
      if (!category) throw new Error("Category not found");
    }

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

    const patchData: Record<string, unknown> = {
      activeVersionId: newVersionId,
      updatedAt: now,
    };
    if (categoryId !== undefined) {
      patchData.categoryId = categoryId;
    }
    await ctx.db.patch(transactionId, patchData);

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

export const deleteTransaction = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const txn = await ctx.db.get(transactionId);
    if (!txn) throw new Error("Transaction not found");

    const versions = await ctx.db
      .query("transaction_versions")
      .withIndex("by_transactionId", (q) => q.eq("transactionId", transactionId))
      .collect();

    const receiptFileIds = versions
      .map((v) => v.receiptFileId)
      .filter((id): id is NonNullable<typeof id> => id !== null);

    for (const fileId of receiptFileIds) {
      await ctx.storage.delete(fileId);
    }

    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    await ctx.db.delete(transactionId);
  },
});

export const createIncome = mutation({
  args: {
    amountCents: v.number(),
    entryDate: v.string(),
    enteredBy: v.union(v.literal("landon"), v.literal("emma")),
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
    spentBy: v.union(v.literal("landon"), v.literal("emma")),
    enteredBy: v.union(v.literal("landon"), v.literal("emma")),
    receiptFileId: v.optional(v.union(v.id("_storage"), v.null())),
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
  },
  handler: async (
    ctx,
    { amountCents, entryDate, description, spentBy, enteredBy, receiptFileId, categoryId },
  ) => {
    assertPositiveCents(amountCents);
    assertValidDate(entryDate);
    assertNonEmpty(description, "description");

    if (categoryId) {
      const category = await ctx.db.get(categoryId);
      if (!category) throw new Error("Category not found");
    }

    const now = Date.now();

    const txnId = await ctx.db.insert("transactions", {
      type: "expense",
      activeVersionId: null,
      categoryId: categoryId ?? null,
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
