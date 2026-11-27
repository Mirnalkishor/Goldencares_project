import { test, expect } from "@playwright/test";

// A signed-in family/user account must land on /account and must not see caregiver UI.
const EMAIL = process.env.TEST_EMAIL || "testuser@goldencares.in";
const PASSWORD = process.env.TEST_PASSWORD || "";

test("user login lands on account dashboard without caregiver UI", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  await expect(page.getByText("Caregiver application")).toHaveCount(0);

  await page.getByRole("button", { name: "Your account" }).click();
  await expect(page.getByRole("menu").getByText("Become a caregiver")).toHaveCount(0);
});

test("signed-out top nav hides Services dropdown", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Services/ })).toHaveCount(0);
});
