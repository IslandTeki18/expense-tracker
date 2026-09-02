import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    nameDisplay: v.string(),
    nameNormalized: v.string(),
    color: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_nameNormalized", ["nameNormalized"])
    .index("by_nameDisplay", ["nameDisplay"]),

  transactions: defineTable({
    type: v.union(v.literal("income"), v.literal("expense")),
    activeVersionId: v.union(v.id("transaction_versions"), v.null()),
    categoryId: v.optional(v.union(v.id("categories"), v.null())),
    createdAt: v.number(),
    createdBy: v.union(v.literal("landon"), v.literal("emma")),
    updatedAt: v.number(),
  }),

  grocery_stores: defineTable({
    nameDisplay: v.string(),
    nameNormalized: v.string(),
    color: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_nameNormalized", ["nameNormalized"])
    .index("by_nameDisplay", ["nameDisplay"]),

  grocery_items: defineTable({
    name: v.string(),
    quantity: v.number(),
    storeId: v.union(v.id("grocery_stores"), v.null()),
    addedBy: v.union(v.literal("landon"), v.literal("emma")),
    completed: v.boolean(),
    completedBy: v.union(v.literal("landon"), v.literal("emma"), v.null()),
    completedAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_completed_createdAt", ["completed", "createdAt"])
    .index("by_storeId", ["storeId"]),

  transaction_versions: defineTable({
    transactionId: v.id("transactions"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amountCents: v.number(),
    entryDate: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    spentBy: v.union(v.literal("landon"), v.literal("emma"), v.null()),
    enteredBy: v.union(v.literal("landon"), v.literal("emma")),
    receiptFileId: v.union(v.id("_storage"), v.null()),
    createdAt: v.number(),
    supersedesVersionId: v.union(v.id("transaction_versions"), v.null()),
  })
    .index("by_transactionId", ["transactionId"])
    .index("by_transactionId_createdAt", ["transactionId", "createdAt"]),
});
