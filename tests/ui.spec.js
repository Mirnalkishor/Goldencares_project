import { test, expect } from "@playwright/test";

// UI smoke test (no Firebase auth/data required).
test("home page renders Golden Cares", async ({ page }) => {
  const resp = await page.goto("/");
  expect(resp?.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();
});

test("booking page renders", async ({ page }) => {
  const resp = await page.goto("/book");
  expect(resp?.status()).toBe(200);
});

test("services page renders", async ({ page }) => {
  const resp = await page.goto("/services");
  expect(resp?.status()).toBe(200);
});
