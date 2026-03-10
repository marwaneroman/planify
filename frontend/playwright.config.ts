import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for Planify frontend.
 * Run with: npm run test:e2e
 * Requires app to be served (e.g. npm run build && npm run preview, or dev server).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: process.env.CI
    ? {
        command: "npx vite preview --port 4173 --host 0.0.0.0",
        url: "http://localhost:4173",
        reuseExistingServer: false,
        timeout: 60_000,
      }
    : {
        command: "npm run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
