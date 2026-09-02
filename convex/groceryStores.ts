import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertValidColor, assertValidName, normalizeName, sanitizeDisplayName } from "./namedEntity";

export const listStores = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("grocery_stores")
      .withIndex("by_nameDisplay")
      .collect();
  },
});

export const createStore = mutation({
  args: {
    nameDisplay: v.string(),
    color: v.string(),
  },
  handler: async (ctx, { nameDisplay, color }) => {
    assertValidName(nameDisplay, "Store");
    assertValidColor(color);

    const sanitized = sanitizeDisplayName(nameDisplay);
    const normalized = normalizeName(nameDisplay);

    const existing = await ctx.db
      .query("grocery_stores")
      .withIndex("by_nameNormalized", (q) => q.eq("nameNormalized", normalized))
      .first();
    if (existing) {
      throw new Error("A store with this name already exists.");
    }

    const now = Date.now();
    return await ctx.db.insert("grocery_stores", {
      nameDisplay: sanitized,
      nameNormalized: normalized,
      color,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStore = mutation({
  args: {
    storeId: v.id("grocery_stores"),
    nameDisplay: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { storeId, nameDisplay, color }) => {
    const store = await ctx.db.get(storeId);
    if (!store) {
      throw new Error("Store not found.");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (nameDisplay !== undefined) {
      assertValidName(nameDisplay, "Store");
      const sanitized = sanitizeDisplayName(nameDisplay);
      const normalized = normalizeName(nameDisplay);

      if (normalized !== store.nameNormalized) {
        const existing = await ctx.db
          .query("grocery_stores")
          .withIndex("by_nameNormalized", (q) => q.eq("nameNormalized", normalized))
          .first();
        if (existing) {
          throw new Error("A store with this name already exists.");
        }
      }

      updates.nameDisplay = sanitized;
      updates.nameNormalized = normalized;
    }

    if (color !== undefined) {
      assertValidColor(color);
      updates.color = color;
    }

    await ctx.db.patch(storeId, updates);
  },
});

export const deleteStore = mutation({
  args: {
    storeId: v.id("grocery_stores"),
  },
  handler: async (ctx, { storeId }) => {
    const store = await ctx.db.get(storeId);
    if (!store) {
      throw new Error("Store not found.");
    }

    const items = await ctx.db
      .query("grocery_items")
      .withIndex("by_storeId", (q) => q.eq("storeId", storeId))
      .collect();
    for (const item of items) {
      await ctx.db.patch(item._id, { storeId: null });
    }

    await ctx.db.delete(storeId);
  },
});
