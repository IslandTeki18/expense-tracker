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
    throw new Error("Category name is required.");
  }
  if (sanitized.length > MAX_NAME_LENGTH) {
    throw new Error(`Category name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }
  const words = sanitized.split(" ").filter((w) => w.length > 0);
  if (words.length > MAX_WORD_COUNT) {
    throw new Error(`Category name must be ${MAX_WORD_COUNT} words or fewer.`);
  }
}

function assertValidColor(color: string): void {
  if (!HEX_COLOR_REGEX.test(color)) {
    throw new Error("Color must be a valid hex color (e.g. #FF5733).");
  }
}

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_nameDisplay")
      .collect();
  },
});

export const createCategory = mutation({
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
      .query("categories")
      .withIndex("by_nameNormalized", (q) => q.eq("nameNormalized", normalized))
      .first();
    if (existing) {
      throw new Error("A category with this name already exists.");
    }

    const now = Date.now();
    return await ctx.db.insert("categories", {
      nameDisplay: sanitized,
      nameNormalized: normalized,
      color,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    nameDisplay: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { categoryId, nameDisplay, color }) => {
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (nameDisplay !== undefined) {
      assertValidName(nameDisplay);
      const sanitized = sanitizeDisplayName(nameDisplay);
      const normalized = normalizeName(nameDisplay);

      if (normalized !== category.nameNormalized) {
        const existing = await ctx.db
          .query("categories")
          .withIndex("by_nameNormalized", (q) => q.eq("nameNormalized", normalized))
          .first();
        if (existing) {
          throw new Error("A category with this name already exists.");
        }
      }

      updates.nameDisplay = sanitized;
      updates.nameNormalized = normalized;
    }

    if (color !== undefined) {
      assertValidColor(color);
      updates.color = color;
    }

    await ctx.db.patch(categoryId, updates);
  },
});

export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, { categoryId }) => {
    const category = await ctx.db.get(categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }

    const transactions = await ctx.db.query("transactions").collect();
    for (const txn of transactions) {
      if (txn.categoryId === categoryId) {
        await ctx.db.patch(txn._id, { categoryId: null });
      }
    }

    await ctx.db.delete(categoryId);
  },
});
