import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_NAME_LENGTH = 30;
const MAX_WORD_COUNT = 3;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function normalizeName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function sanitizeDisplayName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function assertValidName(name: string): void {
  const sanitized = sanitizeDisplayName(name);
  if (sanitized.length === 0) {
    throw new Error("Store name is required.");
  }
  if (sanitized.length > MAX_NAME_LENGTH) {
    throw new Error(`Store name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  const words = sanitized.split(" ").filter((w) => w.length > 0);
  if (words.length > MAX_WORD_COUNT) {
    throw new Error(`Store name must be ${MAX_WORD_COUNT} words or fewer.`);
  }
}

function assertValidColor(color: string): void {
  if (!HEX_COLOR_REGEX.test(color)) {
    throw new Error("Color must be a valid hex color (e.g. #FF5733).");
  }
}

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
    assertValidName(nameDisplay);
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
      assertValidName(nameDisplay);
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
