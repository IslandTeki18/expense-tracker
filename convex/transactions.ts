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

const VALID_SORT_FIELDS = ["date", "amount", "category"] as const;
const VALID_SORT_DIRECTIONS = ["asc", "desc"] as const;
const DEFAULT_PAGE_SIZE = 25;

export const listTransactions = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    sortField: v.optional(v.string()),
    sortDirection: v.optional(v.string()),
    categoryFilter: v.optional(
      v.union(v.id("categories"), v.literal("uncategorized"), v.null()),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page && args.page >= 1 ? Math.floor(args.page) : 1;
    const pageSize = args.pageSize && args.pageSize >= 1
      ? Math.floor(args.pageSize)
      : DEFAULT_PAGE_SIZE;
    const sortField = (VALID_SORT_FIELDS as readonly string[]).includes(args.sortField ?? "")
      ? (args.sortField as (typeof VALID_SORT_FIELDS)[number])
      : "date";
    const sortDirection = (VALID_SORT_DIRECTIONS as readonly string[]).includes(args.sortDirection ?? "")
      ? (args.sortDirection as (typeof VALID_SORT_DIRECTIONS)[number])
      : "desc";

    const allTransactions = await ctx.db.query("transactions").collect();

    // Build enriched rows with version + category data
    const rows = [];
    for (const txn of allTransactions) {
      if (!txn.activeVersionId) continue;
      const version = await ctx.db.get(txn.activeVersionId);
      if (!version) continue;

      let categoryName: string | null = null;
      let categoryColor: string | null = null;
      if (txn.categoryId) {
        const cat = await ctx.db.get(txn.categoryId);
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
    if (args.startDate) {
      filtered = filtered.filter(
        (r) => r.entryDate != null && r.entryDate >= args.startDate!,
      );
    }
    if (args.endDate) {
      filtered = filtered.filter(
        (r) => r.entryDate != null && r.entryDate <= args.endDate!,
      );
    }

    // Filter by category
    if (args.categoryFilter === "uncategorized") {
      filtered = rows.filter((r) => r.type === "expense" && !r.categoryId);
    } else if (args.categoryFilter != null) {
      filtered = rows.filter((r) => r.categoryId === args.categoryFilter);
    }

    // Sort
    const dir = sortDirection === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = (a.entryDate ?? "").localeCompare(b.entryDate ?? "");
      } else if (sortField === "amount") {
        cmp = a.amountCents - b.amountCents;
      } else if (sortField === "category") {
        const labelA = getCatSortLabel(a.type, a.categoryName);
        const labelB = getCatSortLabel(b.type, b.categoryName);
        cmp = labelA.localeCompare(labelB);
      }
      return cmp === 0 ? b.createdAt - a.createdAt : cmp * dir;
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

function getCatSortLabel(
  txnType: string,
  categoryName: string | null,
): string {
  if (txnType === "income") return "\uffff_INCOME";
  if (!categoryName) return "\uffff_UNCATEGORIZED";
  return categoryName.toLowerCase();
}

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
