import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Everything reads from browser storage, so prerendered shells buy nothing here.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
