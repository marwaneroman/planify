/**
 * E2E tests — real user flows (navigation, auth redirect, 404).
 * Run with: npm run test:e2e
 */
import { test, expect } from "@playwright/test";

test.describe("App navigation and pages", () => {
  test("unauthenticated user is redirected to auth page from home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(auth|auth\?.*)/);
    await expect(page.getByText(/sign in|welcome back|planify/i)).toBeVisible();
  });

  test("auth page shows login form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email|you@company/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("404 page is shown for unknown route", async ({ page }) => {
    await page.goto("/non-existent-route-404");
    await expect(page.getByRole("heading", { name: /404/i })).toBeVisible();
    await expect(page.getByText(/page not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /return to home/i })).toBeVisible();
  });

  test("auth page has sign up toggle", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /sign up/i }).click();
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible({ timeout: 5000 });
  });
});
