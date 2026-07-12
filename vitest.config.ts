import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json — Vitest does not read it.
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    // Node by default — the mapping and aggregation logic is pure. A component
    // or hook test opts into jsdom with `// @vitest-environment jsdom` at the
    // top of the file.
    environment: "node",
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
  },
});
