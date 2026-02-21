import { query } from "./_generated/server";

export const ping = query({
  args: {},
  handler: async () => {
    return { message: "Convex is connected", timestamp: Date.now() };
  },
});
