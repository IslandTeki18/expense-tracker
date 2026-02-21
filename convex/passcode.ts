"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

export const verifyPasscode = action({
  args: { attempt: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (_ctx, { attempt }) => {
    if (!attempt.trim()) {
      return { success: false };
    }

    const hash = process.env.PASSCODE_HASH;
    if (!hash) {
      console.error("PASSCODE_HASH environment variable is not set");
      return { success: false };
    }

    const match = await bcrypt.compare(attempt, hash);
    return { success: match };
  },
});
