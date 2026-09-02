import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Old routes folded into the merged settings screen.
    return [
      { source: "/settings/categories", destination: "/settings", permanent: false },
      { source: "/grocery/stores", destination: "/settings", permanent: false },
    ];
  },
};

export default nextConfig;
