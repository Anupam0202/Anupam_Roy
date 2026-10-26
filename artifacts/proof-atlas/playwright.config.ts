import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 4173);

/**
 * End-to-end tests run against scripts/serve-local.mjs, which serves the
 * built site with vercel.json's redirects and headers and the real API.
 * Build first: `pnpm run build` at the repository root.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  webServer: {
    command: "node ../../scripts/serve-local.mjs",
    url: `http://127.0.0.1:${PORT}/api/healthz`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT), NODE_ENV: "production", LOG_LEVEL: "silent", GEMINI_API_KEY: "", RESEND_API_KEY: "" },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // WebKit runs in CI (or with E2E_WEBKIT=1 once `playwright install webkit` has run) for the page-level specs.
    ...(process.env.CI || process.env.E2E_WEBKIT
      ? [{ name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /(routes|layout|progressive|a11y)\.spec\.ts$/ }]
      : []),
  ],
});
