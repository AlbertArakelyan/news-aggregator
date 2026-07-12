import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Emits .next/standalone with a self-contained server.js, so the Docker
  // runtime stage can ship without node_modules.
  output: "standalone",
};

export default nextConfig;
