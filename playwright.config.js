import { defineConfig, devices } from "@playwright/test";

// Local UI testing for `realf` (TanStack Start + Vite + Firebase). `npm test` stays `node --test`.
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.@(js|ts)",
  timeout: 30_000,
  fullyParallel: true,
  use: { baseURL: "http://localhost:5173", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
