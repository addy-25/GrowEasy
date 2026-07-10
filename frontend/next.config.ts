import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" makes `next build` emit a self-contained server bundle
  // (server.js + minimal node_modules) — what our Dockerfile runtime stage copies.
  output: "standalone",
};

export default nextConfig;
