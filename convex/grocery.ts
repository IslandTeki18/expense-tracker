import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const personValidator = v.union(v.literal("you"), v.literal("wife"));

function assertValidName(name: string): void {
  if (name.trim().length === 0) {
    throw new Error("Item name is required.");
  }
}

function assertValidQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a whole number of 1 or more.");
  }
}

export const listItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("grocery_items").collect();

    const storeIds = [...new Set(items.map((i) => i.storeId).filter(Boolean))];
    const stores = await Promise.all(
      storeIds.map((id) => ctx.db.get(id!)),
    );
    const storeMap = new Map(
      stores.filter(Boolean).map((s) => [s!._id, s!]),
    );

    return items.map((item) => ({
      ...item,
      store: item.storeId ? storeMap.get(item.storeId) ?? null : null,
    }));
  },
});

export const addItem = mutation({
  args: {
    name: v.string(),
    quantity: v.number(),
    storeId: v.optional(v.union(v.id("grocery_stores"), v.null())),
    addedBy: personValidator,
  },
  handler: async (ctx, { name, quantity, storeId, addedBy }) => {
    const trimmedName = name.trim();
    assertValidName(trimmedName);
    assertValidQuantity(quantity);

    if (storeId) {
      const store = await ctx.db.get(storeId);
      if (!store) {
        throw new Error("Store not found.");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("grocery_items", {
      name: trimmedName,
      quantity,
      storeId: storeId ?? null,
      addedBy,
      completed: false,
      completedBy: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const editItem = mutation({
  args: {
    itemId: v.id("grocery_items"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    storeId: v.optional(v.union(v.id("grocery_stores"), v.null())),
  },
  handler: async (ctx, { itemId, name, quantity, storeId }) => {
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Item not found.");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) {
      const trimmed = name.trim();
      assertValidName(trimmed);
      updates.name = trimmed;
    }

    if (quantity !== undefined) {
      assertValidQuantity(quantity);
      updates.quantity = quantity;
    }

    if (storeId !== undefined) {
      if (storeId !== null) {
        const store = await ctx.db.get(storeId);
        if (!store) {
          throw new Error("Store not found.");
        }
      }
      updates.storeId = storeId;
    }

    await ctx.db.patch(itemId, updates);
  },
});

export const toggleItem = mutation({
  args: {
    itemId: v.id("grocery_items"),
    completedBy: personValidator,
  },
  handler: async (ctx, { itemId, completedBy }) => {
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Item not found.");
    }

    if (item.completed) {
      await ctx.db.patch(itemId, {
        completed: false,
        completedBy: null,
        completedAt: null,
        updatedAt: Date.now(),
      });
    } else {
      const now = Date.now();
      await ctx.db.patch(itemId, {
        completed: true,
        completedBy,
        completedAt: now,
        updatedAt: now,
      });
    }
  },
});

export const deleteItem = mutation({
  args: {
    itemId: v.id("grocery_items"),
  },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Item not found.");
    }
    await ctx.db.delete(itemId);
  },
});

export const clearCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const completed = await ctx.db
      .query("grocery_items")
      .withIndex("by_completed_createdAt", (q) => q.eq("completed", true))
      .collect();

    for (const item of completed) {
      await ctx.db.delete(item._id);
    }

    return { deleted: completed.length };
  },
});
