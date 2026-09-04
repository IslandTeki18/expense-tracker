import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shared Ledger",
    short_name: "Ledger",
    description: "Track shared income and expenses for one bank account",
    // scope "/" keeps every route (ledger, grocery, settings, transaction detail)
    // inside the installed app instead of an in-app Safari browser view.
    scope: "/",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [{ src: "/mark-dark.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
