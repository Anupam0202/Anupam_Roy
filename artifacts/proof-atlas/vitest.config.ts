import { defineConfig } from "vitest/config";

// Unit tests only; Playwright runs tests/e2e against the built site.
export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"] },
});
